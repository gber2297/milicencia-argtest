import fs from "node:fs/promises"
import path from "node:path"

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"
import sharp from "sharp"

const PDF_PATH = path.resolve("cuestionario.pdf")
const QUESTIONS_PATH = path.resolve("tmp/questions-from-pdf.json")
const OUTPUT_PATH = path.resolve("tmp/questions-from-pdf-with-correct.json")

function isQuestionMarker(text) {
  return /^\d{1,4}\)/.test(text.trim())
}

function isOptionMarker(text) {
  const t = text.trim()
  return /^[a-dA-D]\)$/.test(t) || t === "•"
}

function buildPageStructure(items) {
  const tokens = items.map((item, index) => ({
    index,
    text: (item.str ?? "").trim(),
    x: item.transform?.[4] ?? 0,
    y: item.transform?.[5] ?? 0,
    h: item.height ?? 8,
    w: item.width ?? 0,
  }))

  const questionStarts = []
  for (const token of tokens) {
    if (isQuestionMarker(token.text)) {
      const numberMatch = token.text.match(/^(\d{1,4})\)/)
      if (!numberMatch) continue
      questionStarts.push({
        questionNumber: Number(numberMatch[1]),
        startIndex: token.index,
      })
    }
  }

  const questions = []
  for (let i = 0; i < questionStarts.length; i += 1) {
    const start = questionStarts[i]
    const end = questionStarts[i + 1]?.startIndex ?? tokens.length
    const segment = tokens.slice(start.startIndex, end)
    const optionMarkers = segment.filter((token) => isOptionMarker(token.text))

    const normalizedMarkers = optionMarkers.map((marker, idx) => ({
      ...marker,
      letter:
        marker.text === "•"
          ? idx === 0
            ? "A"
            : "B"
          : marker.text[0].toUpperCase(),
    }))

    questions.push({
      questionNumber: start.questionNumber,
      startIndex: start.startIndex,
      endIndex: end,
      segment,
      optionMarkers: normalizedMarkers,
    })
  }

  return questions
}

function markerBbox(marker) {
  const minX = marker.x
  const maxX = marker.x + Math.max(marker.w, 6)
  const minY = marker.y - Math.max(marker.h, 8)
  const maxY = marker.y + Math.max(marker.h, 8)
  return { minX, maxX, minY, maxY }
}

function toImageRect(bbox, viewport, imageMeta) {
  const scaleX = imageMeta.width / viewport.width
  const scaleY = imageMeta.height / viewport.height

  const left = Math.max(0, Math.floor(bbox.minX * scaleX) - 6)
  const right = Math.min(imageMeta.width - 1, Math.ceil(bbox.maxX * scaleX) + 6)
  const top = Math.max(0, Math.floor((viewport.height - bbox.maxY) * scaleY) - 6)
  const bottom = Math.min(
    imageMeta.height - 1,
    Math.ceil((viewport.height - bbox.minY) * scaleY) + 6,
  )

  const width = Math.max(1, right - left + 1)
  const height = Math.max(1, bottom - top + 1)
  return { left, top, width, height }
}

function greenScoreFromRaw(raw, channels) {
  let green = 0
  let total = 0
  for (let i = 0; i < raw.length; i += channels) {
    const r = raw[i]
    const g = raw[i + 1]
    const b = raw[i + 2]
    total += 1
    if (g > 85 && g > r * 1.2 && g > b * 1.2) green += 1
  }
  return total ? green / total : 0
}

async function run() {
  const base = JSON.parse(await fs.readFile(QUESTIONS_PATH, "utf8"))
  const questions = base.questions ?? []
  const data = new Uint8Array(await fs.readFile(PDF_PATH))
  const doc = await pdfjs.getDocument({ data }).promise

  const byPage = new Map()
  for (const question of questions) {
    const list = byPage.get(question.source_page) ?? []
    list.push(question)
    byPage.set(question.source_page, list)
  }

  let detected = 0
  let skipped = 0

  for (const [pageNumber, pageQuestions] of byPage.entries()) {
    const page = await doc.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1 })
    const textContent = await page.getTextContent()
    const structure = buildPageStructure(textContent.items)

    const pageHex = pageNumber.toString(16)
    const imagePath = path.resolve(
      `tmp/cuestionario-images/page-${String(pageNumber).padStart(4, "0")}-${pageHex}.png`,
    )

    let image
    let imageMeta
    try {
      image = sharp(imagePath, { limitInputPixels: false })
      imageMeta = await image.metadata()
      if (!imageMeta.width || !imageMeta.height) throw new Error("metadata invalida")
    } catch {
      skipped += pageQuestions.length
      continue
    }

    for (const question of pageQuestions) {
      const parsed = structure.find((item) => item.questionNumber === question.source_number)
      if (!parsed || !parsed.optionMarkers.length) {
        skipped += 1
        continue
      }

      const optionScores = []
      for (let i = 0; i < parsed.optionMarkers.length; i += 1) {
        const marker = parsed.optionMarkers[i]
        const bbox = markerBbox(marker)
        if (!bbox) continue

        const rect = toImageRect(bbox, viewport, imageMeta)
        const extracted = await image
          .clone()
          .extract(rect)
          .raw()
          .toBuffer({ resolveWithObject: true })

        const score = greenScoreFromRaw(extracted.data, extracted.info.channels)
        optionScores.push({ letter: marker.letter, score })
      }

      if (!optionScores.length) {
        skipped += 1
        continue
      }

      optionScores.sort((a, b) => b.score - a.score)
      const best = optionScores[0]
      const second = optionScores[1]
      const strongEnough =
        best.score > 0.006 &&
        (!second || best.score > second.score * 1.2 || best.score - second.score > 0.002)

      if (!strongEnough) {
        skipped += 1
        continue
      }

      question.correct_option_letter = best.letter
      question.correct_option_detection = "green-pixel-analysis"
      question.options = question.options.map((option) => ({
        ...option,
        is_correct: option.source_letter === best.letter,
      }))
      detected += 1
    }
  }

  base.generated_at = new Date().toISOString()
  base.correct_detection_summary = {
    detected,
    skipped,
    total_questions: questions.length,
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(base, null, 2), "utf8")
  console.log(`Correctas detectadas: ${detected}`)
  console.log(`Sin deteccion: ${skipped}`)
  console.log(`Salida: ${OUTPUT_PATH}`)
}

run().catch((error) => {
  console.error("Error detectando respuestas correctas por color:", error)
  process.exitCode = 1
})
