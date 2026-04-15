/**
 * Construye un subconjunto fijo de preguntas para el MVP desde el parse HTML o cuestionario-compilado.json.
 * Criterios: enunciado >= 25 caracteres, 2–4 opciones, exactamente 1 opción marcada correcta.
 */
import fs from "node:fs/promises"
import path from "node:path"

const DEFAULT_COUNT = 100
const DEFAULT_SEED = 20260415
const MIN_STEM_LEN = 25

function getArg(name) {
  const key = `--${name}`
  const found = process.argv.find((arg) => arg === key || arg.startsWith(`${key}=`))
  if (!found) return null
  const [, value] = found.split("=")
  return value ?? "true"
}

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleInPlace(arr, rand) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function isEligibleMvp(q) {
  const text = (q.question_text ?? "").trim()
  if (text.length < MIN_STEM_LEN) return false
  const opts = Array.isArray(q.options) ? q.options : []
  if (opts.length < 2 || opts.length > 4) return false
  const correctCount = opts.filter((o) => o.is_correct).length
  if (correctCount !== 1) return false
  const letters = Array.isArray(q.correct_option_letters)
    ? q.correct_option_letters
    : q.correct_option_letter
      ? [q.correct_option_letter]
      : []
  if (letters.length > 1) return false
  return true
}

function fromCompilado(raw) {
  const preguntas = raw.preguntas ?? []
  return preguntas.map((p) => ({
    question_text: p.texto ?? "",
    explanation: null,
    difficulty: p.dificultad ?? "medium",
    source_page_image: p.imagen_pagina ?? null,
    source_page: p.pagina_fuente ?? null,
    source_number: p.numero_fuente ?? null,
    correct_option_letters: p.respuestas_correctas ?? [],
    correct_option_detection: p.deteccion_correcta ?? null,
    options: (p.opciones ?? []).map((o) => ({
      option_text: o.texto ?? "",
      is_correct: !!o.es_correcta,
      source_letter: o.letra,
    })),
  }))
}

function toImportShape(q) {
  return {
    question_text: q.question_text,
    explanation: q.explanation ?? null,
    difficulty: q.difficulty ?? "medium",
    source_page_image: q.source_page_image ?? null,
    source_page: q.source_page ?? null,
    source_number: q.source_number ?? null,
    options: (q.options ?? []).map((o) => ({
      option_text: o.option_text,
      is_correct: !!o.is_correct,
    })),
  }
}

/**
 * Muestra aproximadamente count ítems repartiendo por dificultad (easy/medium/hard).
 */
function stratifiedPick(eligible, count, seed) {
  const rand = mulberry32(seed)
  const buckets = { easy: [], medium: [], hard: [] }
  for (const item of eligible) {
    const d = item.difficulty === "easy" || item.difficulty === "hard" ? item.difficulty : "medium"
    buckets[d].push(item)
  }
  for (const k of Object.keys(buckets)) shuffleInPlace(buckets[k], rand)

  const ratios = { easy: 0.33, medium: 0.47, hard: 0.2 }
  let targetEasy = Math.round(count * ratios.easy)
  let targetMedium = Math.round(count * ratios.medium)
  let targetHard = count - targetEasy - targetMedium
  if (targetHard < 0) {
    targetMedium += targetHard
    targetHard = 0
  }

  const out = []
  function takeFrom(bucket, n) {
    while (out.length < count && n > 0 && buckets[bucket].length) {
      out.push(buckets[bucket].pop())
      n -= 1
    }
  }

  takeFrom("easy", targetEasy)
  takeFrom("medium", targetMedium)
  takeFrom("hard", targetHard)

  const pool = [...buckets.easy, ...buckets.medium, ...buckets.hard]
  shuffleInPlace(pool, rand)
  while (out.length < count && pool.length) out.push(pool.pop())

  return out.slice(0, count)
}

async function loadQuestions() {
  const htmlPath = path.resolve("tmp/questions-from-html.json")
  const compiladoPath = path.resolve("cuestionario-compilado.json")

  try {
    const raw = JSON.parse(await fs.readFile(htmlPath, "utf8"))
    const list = raw.questions ?? []
    if (list.length) return { list, source: htmlPath, meta: raw }
  } catch {
    /* siguiente fuente */
  }

  const raw = JSON.parse(await fs.readFile(compiladoPath, "utf8"))
  return { list: fromCompilado(raw), source: compiladoPath, meta: raw }
}

async function run() {
  const count = Number(getArg("count") ?? DEFAULT_COUNT)
  const seed = Number(getArg("seed") ?? DEFAULT_SEED)
  const outPath = path.resolve(getArg("output") ?? "tmp/mvp-100.json")

  const { list, source } = await loadQuestions()
  const eligible = list.filter(isEligibleMvp)
  const picked = stratifiedPick(eligible, Math.min(count, eligible.length), seed)
  const questions = picked.map(toImportShape)

  const payload = {
    source,
    generated_at: new Date().toISOString(),
    mvp: {
      target_count: count,
      output_count: questions.length,
      seed,
      min_stem_length: MIN_STEM_LEN,
      rules: "2–4 opciones, exactamente 1 correcta, enunciado >= min_stem_length, una sola letra en correct_option_letters si existe",
    },
    estadisticas: {
      fuente_total: list.length,
      elegibles_mvp: eligible.length,
    },
    questions,
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8")

  console.log(`Fuente: ${source}`)
  console.log(`Elegibles MVP: ${eligible.length} / ${list.length}`)
  console.log(`Escritas: ${questions.length} → ${outPath}`)
  if (questions.length < count) {
    console.warn(`Solo hay ${questions.length} preguntas que cumplen criterios (pedidas: ${count}).`)
  }
}

run().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
