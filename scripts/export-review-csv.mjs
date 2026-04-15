import fs from "node:fs/promises"
import path from "node:path"

const INPUT = path.resolve("tmp/questions-from-pdf-with-correct.json")
const OUTPUT = path.resolve("tmp/questions-review.csv")

function csvEscape(value) {
  const text = String(value ?? "")
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

async function run() {
  const payload = JSON.parse(await fs.readFile(INPUT, "utf8"))
  const questions = payload.questions ?? []

  const header = [
    "source_page",
    "source_number",
    "question_text",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "detected_correct_letter",
    "review_correct_letter",
  ]

  const rows = [header.join(",")]

  for (const question of questions) {
    const optionByLetter = new Map()
    for (const option of question.options ?? []) {
      optionByLetter.set(option.source_letter, option.option_text)
    }

    rows.push(
      [
        question.source_page,
        question.source_number,
        question.question_text,
        optionByLetter.get("A") ?? "",
        optionByLetter.get("B") ?? "",
        optionByLetter.get("C") ?? "",
        optionByLetter.get("D") ?? "",
        question.correct_option_letter ?? "",
        "",
      ]
        .map(csvEscape)
        .join(","),
    )
  }

  await fs.writeFile(OUTPUT, `${rows.join("\n")}\n`, "utf8")
  console.log(`CSV de revision generado: ${OUTPUT}`)
}

run().catch((error) => {
  console.error("Error exportando CSV de revision:", error)
  process.exitCode = 1
})
