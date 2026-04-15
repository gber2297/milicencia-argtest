import fs from "node:fs/promises"
import path from "node:path"

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"

const PDF_PATH = path.resolve("cuestionario.pdf")
const OUTPUT_PATH = path.resolve("tmp/questions-from-pdf.json")

function cleanLine(line) {
  return line
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "")
}

function classifyDifficulty({ questionText }) {
  const full = questionText.toLowerCase()
  let points = 0
  if (questionText.length > 120) points += 2
  if (questionText.length > 85) points += 1
  if (/(excepto|prioridad|interseccion|alcoholemia|frenado|eliminatorio|autopista)/i.test(full))
    points += 2
  if (/(remolque|licencia|senal|semaforo|peaton)/i.test(full)) points += 1
  if (points >= 4) return "hard"
  if (points >= 2) return "medium"
  return "easy"
}

function parsePageQuestions(pageText) {
  const blocks = []
  const regex = /(?:^|\n)\s*(\d{1,4})\)\s+([\s\S]*?)(?=(?:\n\s*\d{1,4}\)\s)|$)/g
  let match
  while ((match = regex.exec(pageText)) !== null) {
    blocks.push({ source_number: Number(match[1]), content: match[2].trim() })
  }
  return blocks
}

function parseOptions(content) {
  const options = []
  const optionRegex =
    /(?:^|\n)\s*([a-dA-D])\)\s+([\s\S]*?)(?=(?:\n\s*[a-dA-D]\)\s)|(?:\n\s*[•\-]\s)|$)/g
  let match
  while ((match = optionRegex.exec(content)) !== null) {
    options.push({
      letter: match[1].toUpperCase(),
      option_text: cleanLine(match[2]),
    })
  }

  if (!options.length) {
    const vfRegex = /(?:^|\n)\s*[•\-]\s*(Verdadero|Falso)\.?/gi
    let vf
    while ((vf = vfRegex.exec(content)) !== null) {
      options.push({
        letter: options.length === 0 ? "A" : "B",
        option_text: cleanLine(vf[1]),
      })
    }
  }

  return options
}

function extractQuestionText(content) {
  const firstOption = content.search(/(?:^|\n)\s*[a-dA-D]\)\s+|(?:^|\n)\s*[•\-]\s*(Verdadero|Falso)/i)
  if (firstOption < 0) return cleanLine(content)
  return cleanLine(content.slice(0, firstOption))
}

async function run() {
  const data = new Uint8Array(await fs.readFile(PDF_PATH))
  const doc = await pdfjs.getDocument({ data }).promise

  const questions = []
  const rejected = []

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber)
    const textContent = await page.getTextContent()
    let pageText = ""
    for (const item of textContent.items) {
      pageText += item.str
      pageText += item.hasEOL ? "\n" : " "
    }

    const blocks = parsePageQuestions(pageText)
    for (const block of blocks) {
      const questionText = extractQuestionText(block.content)
      const options = parseOptions(block.content)
      if (!questionText || options.length < 2) {
        rejected.push({
          page: pageNumber,
          source_number: block.source_number,
          reason: "No se pudo extraer pregunta/opciones con estructura esperada",
        })
        continue
      }

      const normalizedOptions = options.map((option) => ({
        option_text: option.option_text,
        is_correct: false,
        source_letter: option.letter,
      }))

      questions.push({
        source_page: pageNumber,
        source_number: block.source_number,
        source_page_image: `tmp/cuestionario-images/page-${String(pageNumber).padStart(4, "0")}-${pageNumber.toString(16)}.png`,
        question_text: questionText,
        explanation: "Importada desde PDF. Sin explicacion explicita en bloque fuente.",
        difficulty: classifyDifficulty({ questionText }),
        correct_option_letter: null,
        correct_option_detection: "not-detected-from-pdf-text-color",
        options: normalizedOptions,
      })
    }
  }

  const dedupMap = new Map()
  for (const question of questions) {
    const key = question.question_text.toLowerCase()
    if (!dedupMap.has(key)) dedupMap.set(key, question)
  }
  const unique = [...dedupMap.values()]

  const payload = {
    generated_at: new Date().toISOString(),
    total_pages: doc.numPages,
    total_questions: questions.length,
    total_unique: unique.length,
    total_rejected: rejected.length,
    questions: unique,
    rejected,
    notes: [
      "El texto del PDF se extrajo correctamente.",
      "No fue posible detectar automaticamente la opcion correcta por color verde con metadatos de texto PDF.",
      "Se recomienda un paso adicional de deteccion visual por color sobre render de pagina para marcar correctas.",
    ],
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8")
  console.log(`Preguntas extraidas: ${questions.length}`)
  console.log(`Preguntas unicas: ${unique.length}`)
  console.log(`Descartadas: ${rejected.length}`)
  console.log(`Salida: ${OUTPUT_PATH}`)
}

run().catch((error) => {
  console.error("Error parseando preguntas desde PDF:", error)
  process.exitCode = 1
})
