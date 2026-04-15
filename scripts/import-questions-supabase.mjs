import fs from "node:fs/promises"
import path from "node:path"

import { createClient } from "@supabase/supabase-js"

function getInputPath() {
  const fromArg = process.argv.find((arg) => arg.startsWith("--input="))
  if (fromArg) {
    const [, value] = fromArg.split("=")
    return path.resolve(value ?? "tmp/questions-parsed.json")
  }
  if (process.env.QUESTIONS_JSON) return path.resolve(process.env.QUESTIONS_JSON)
  return path.resolve("tmp/questions-parsed.json")
}

function getArg(name) {
  const key = `--${name}`
  const found = process.argv.find((arg) => arg === key || arg.startsWith(`${key}=`))
  if (!found) return null
  const [, value] = found.split("=")
  return value ?? "true"
}

function inferCategorySlug(questionText) {
  const text = questionText.toLowerCase()

  const rules = [
    { slug: "senales", patterns: [/senal|semaforo|cartel|octogono|triangulo/] },
    { slug: "prioridad_de_paso", patterns: [/prioridad|rotonda|interseccion|cruce/] },
    { slug: "velocidad", patterns: [/velocidad|km\/h|rapido|lenta/] },
    { slug: "alcohol_y_sustancias", patterns: [/alcohol|droga|sustancia|alcoholemia/] },
    { slug: "documentacion", patterns: [/licencia|cedula|seguro|documentacion|vtv/] },
    { slug: "seguridad_vial", patterns: [/distancia|cinturon|casco|maniobra|preventiva/] },
    { slug: "infracciones", patterns: [/infraccion|multa|prohibido|sancion/] },
    { slug: "estacionamiento", patterns: [/estacionar|estacionamiento|doble fila|cordon/] },
    { slug: "luces", patterns: [/luces|balizas|altas|bajas/] },
  ]

  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) return rule.slug
  }

  return "generales"
}

function assertEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Falta variable de entorno: ${name}`)
  return value
}

/**
 * Next.js solo inyecta `.env.local` al ejecutar `next`; un script `node ...` no lo lee solo.
 * Carga `.env.local` y luego `.env` desde la raíz del repo (cwd), sin pisar variables ya definidas.
 */
async function loadEnvFromRepo() {
  const root = process.cwd()
  const files = [path.join(root, ".env.local"), path.join(root, ".env")]
  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf8")
      for (let line of content.split("\n")) {
        line = line.trim()
        if (!line || line.startsWith("#")) continue
        if (line.startsWith("export ")) line = line.slice(7).trim()
        const eq = line.indexOf("=")
        if (eq === -1) continue
        const key = line.slice(0, eq).trim()
        if (!key || process.env[key] !== undefined) continue
        let value = line.slice(eq + 1).trim()
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        )
          value = value.slice(1, -1)
        process.env[key] = value
      }
    } catch {
      /* archivo ausente */
    }
  }
}

async function run() {
  await loadEnvFromRepo()

  const apply = getArg("apply") === "true"
  const limitArg = getArg("limit")
  const limit = limitArg ? Number(limitArg) : null

  const supabaseUrl = assertEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = assertEnv("SUPABASE_SERVICE_ROLE_KEY")
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const inputPath = getInputPath()
  const raw = await fs.readFile(inputPath, "utf8")
  const parsed = JSON.parse(raw)
  const questionsInput = Array.isArray(parsed.questions) ? parsed.questions : []
  const questions = limit ? questionsInput.slice(0, limit) : questionsInput
  if (!questions.length) throw new Error("No hay preguntas para importar")

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("id, slug")
  if (categoriesError) throw categoriesError

  const categoryBySlug = new Map(categoriesData.map((category) => [category.slug, category.id]))

  const report = {
    mode: apply ? "apply" : "dry-run",
    totalInput: questions.length,
    inserted: 0,
    skippedDuplicates: 0,
    invalid: 0,
    errors: [],
  }

  for (const item of questions) {
    const options = Array.isArray(item.options) ? item.options : []
    const correctCount = options.filter((option) => option.is_correct).length

    if (!item.question_text || options.length < 2 || options.length > 4 || correctCount !== 1) {
      report.invalid += 1
      report.errors.push({
        question: item.question_text?.slice(0, 120) ?? "(sin texto)",
        reason: "Formato invalido: requiere 2–4 opciones y solo 1 correcta",
      })
      continue
    }

    const { data: existing, error: existingError } = await supabase
      .from("questions")
      .select("id")
      .eq("question_text", item.question_text)
      .maybeSingle()
    if (existingError) {
      report.errors.push({ question: item.question_text.slice(0, 120), reason: existingError.message })
      continue
    }
    if (existing) {
      report.skippedDuplicates += 1
      continue
    }

    const slug = inferCategorySlug(item.question_text)
    const categoryId = categoryBySlug.get(slug) ?? categoryBySlug.get("generales") ?? null
    const questionRow = {
      question_text: item.question_text,
      explanation: item.explanation ?? null,
      category_id: categoryId,
      difficulty: item.difficulty ?? "medium",
      source: item.source_page_image
        ? `pdf-image:${item.source_page_image}`
        : `ocr:${item.source_image_file ?? "unknown"}`,
      is_active: true,
    }

    if (!apply) {
      report.inserted += 1
      continue
    }

    const { data: question, error: insertQuestionError } = await supabase
      .from("questions")
      .insert(questionRow)
      .select("id")
      .single()

    if (insertQuestionError || !question) {
      report.errors.push({
        question: item.question_text.slice(0, 120),
        reason: insertQuestionError?.message ?? "No se pudo insertar la pregunta",
      })
      continue
    }

    const optionsPayload = options.map((option) => ({
      question_id: question.id,
      option_text: option.option_text,
      is_correct: Boolean(option.is_correct),
    }))
    const { error: insertOptionsError } = await supabase.from("question_options").insert(optionsPayload)

    if (insertOptionsError) {
      report.errors.push({
        question: item.question_text.slice(0, 120),
        reason: `Pregunta creada sin opciones: ${insertOptionsError.message}`,
      })
      continue
    }

    report.inserted += 1
  }

  const reportPath = path.resolve("tmp/import-report.json")
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8")
  console.log(JSON.stringify(report, null, 2))
  console.log(`Reporte: ${reportPath}`)
}

run().catch((error) => {
  console.error("Error importando preguntas:", error)
  process.exitCode = 1
})
