/**
 * Asigna category_id a preguntas con NULL, usando la misma heurística que import-questions-supabase.mjs.
 *
 * Requisitos: filas en public.categories (ej. ejecutar INSERT de categorías en seed.sql).
 *
 * Uso: node scripts/backfill-question-categories.mjs
 *      node scripts/backfill-question-categories.mjs --apply=true
 */
import fs from "node:fs/promises"
import path from "node:path"

import { createClient } from "@supabase/supabase-js"

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
      /* ausente */
    }
  }
}

function getArg(name) {
  const key = `--${name}`
  const found = process.argv.find((arg) => arg === key || arg.startsWith(`${key}=`))
  if (!found) return null
  const [, value] = found.split("=")
  return value ?? "true"
}

async function run() {
  await loadEnvFromRepo()

  const apply = getArg("apply") === "true"
  const supabaseUrl = assertEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = assertEnv("SUPABASE_SERVICE_ROLE_KEY")
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  const { data: categories, error: catErr } = await supabase.from("categories").select("id, slug")
  if (catErr) throw catErr
  if (!categories?.length) {
    console.error(
      "No hay categorías en la base. Ejecutá en Supabase el INSERT de categorías de supabase/seed.sql (líneas 1–13) y volvé a correr este script.",
    )
    process.exitCode = 1
    return
  }

  const bySlug = new Map(categories.map((c) => [c.slug, c.id]))

  const { data: missing, error: qErr } = await supabase
    .from("questions")
    .select("id, question_text")
    .is("category_id", null)

  if (qErr) throw qErr

  const rows = missing ?? []
  const report = { total: rows.length, wouldUpdate: 0, updated: 0, skipped: 0, errors: [] }

  for (const q of rows) {
    const slug = inferCategorySlug(q.question_text)
    const categoryId = bySlug.get(slug) ?? bySlug.get("generales")
    if (!categoryId) {
      report.skipped += 1
      continue
    }
    report.wouldUpdate += 1

    if (!apply) continue

    const { error: upErr } = await supabase.from("questions").update({ category_id: categoryId }).eq("id", q.id)

    if (upErr) report.errors.push({ id: q.id, reason: upErr.message })
    else report.updated += 1
  }

  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...report }, null, 2))
  if (!apply && report.wouldUpdate > 0) {
    console.log("\nPara aplicar: node scripts/backfill-question-categories.mjs --apply=true")
  }
}

run().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
