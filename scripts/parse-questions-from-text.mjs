import fs from "node:fs/promises"
import path from "node:path"

function getArg(name) {
  const key = `--${name}`
  const found = process.argv.find((arg) => arg === key || arg.startsWith(`${key}=`))
  if (!found) return null
  const [, value] = found.split("=")
  return value ?? "true"
}

function normalizeQuestionText(text) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}

function parseOptionsBlock(rawOptions) {
  const lines = rawOptions.replace(/\r/g, "").split("\n")
  const options = []
  let current = null

  for (const originalLine of lines) {
    const line = originalLine.trim()
    if (!line) continue

    const match = line.match(/^([A-D])[\.\)]\s*(.+)$/i)
    if (match) {
      const letter = match[1].toUpperCase()
      const optionText = match[2].trim()
      current = { source_letter: letter, option_text: optionText }
      options.push(current)
      continue
    }

    if (!current) continue
    current.option_text = `${current.option_text} ${line}`.replace(/\s+/g, " ").trim()
  }

  return options
}

function extractBlocks(text) {
  const blocks = []
  const normalized = text.replace(/\r/g, "")
  const pattern =
    /(?:^|\n)\s*(\d+)[\).]?\s*\n\s*Pregunta:\s*\n([\s\S]*?)\n\s*Opciones:\s*\n([\s\S]*?)\n\s*Correcta:\s*([A-D](?:\s*,\s*[A-D])*)\s*(?=\n\s*\d+[\).]?\s*\n\s*Pregunta:|$)/gim

  let match
  while ((match = pattern.exec(normalized)) !== null) {
    const sourceNumber = Number(match[1])
    const questionText = normalizeQuestionText(match[2])
    const options = parseOptionsBlock(match[3])
    const correctLetters = match[4]
      .split(",")
      .map((letter) => letter.trim().toUpperCase())
      .filter(Boolean)

    blocks.push({
      source_number: sourceNumber,
      question_text: questionText,
      options,
      correct_letters: correctLetters,
    })
  }

  return blocks
}

function toImportQuestion(rawItem) {
  const options = rawItem.options.map((option) => ({
    option_text: option.option_text,
    is_correct: rawItem.correct_letters.includes(option.source_letter),
  }))

  return {
    question_text: rawItem.question_text,
    explanation: null,
    difficulty: "medium",
    source_page_image: null,
    source_page: null,
    source_number: rawItem.source_number,
    options,
  }
}

async function run() {
  const inputPath = path.resolve(getArg("input") ?? "tmp/manual-questions.txt")
  const outputPath = path.resolve(getArg("output") ?? "tmp/manual-questions.json")

  const text = await fs.readFile(inputPath, "utf8")
  const parsed = extractBlocks(text)

  const report = {
    total_detected: parsed.length,
    accepted: 0,
    invalid: 0,
    errors: [],
  }

  const questions = []
  for (const item of parsed) {
    const correctCount = item.correct_letters.length
    const optionCount = item.options.length

    if (!item.question_text || optionCount < 2 || optionCount > 4 || correctCount !== 1) {
      report.invalid += 1
      report.errors.push({
        source_number: item.source_number,
        reason: "Formato invalido: requiere 2-4 opciones y una unica correcta",
      })
      continue
    }

    const hasCorrectOption = item.options.some((option) => item.correct_letters.includes(option.source_letter))
    if (!hasCorrectOption) {
      report.invalid += 1
      report.errors.push({
        source_number: item.source_number,
        reason: "La letra marcada como correcta no coincide con las opciones",
      })
      continue
    }

    questions.push(toImportQuestion(item))
    report.accepted += 1
  }

  const payload = {
    source: inputPath,
    generated_at: new Date().toISOString(),
    format: "plain-text-pregunta-opciones-correcta",
    report,
    questions,
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8")

  console.log(`Leidas: ${report.total_detected}`)
  console.log(`Validas: ${report.accepted}`)
  console.log(`Invalidas: ${report.invalid}`)
  console.log(`JSON: ${outputPath}`)
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
