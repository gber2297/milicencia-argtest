/**
 * Limpieza de ruido típico del PDF→htmlEX: cabeceras/pies, soft hyphens, líneas basura.
 * Uso: import { cleanExamText } from "./exam-text-cleanup.mjs"
 */

const SOFT_HYPHEN = /\u00ad/g

/** Líneas que suelen ser solo encabezado/pie (no texto de pregunta/opción) */
const LINE_IS_ONLY_NOISE = [
  /^\s*Buenos\s+Aires\s*$/i,
  /^\s*>\s*Buenos\s+Aires\s*$/i,
  /^\s*Provincia\s*$/i,
  /^\s*Direcci[oó]n\s+Provincial[^\n]*$/i,
  /^\s*\d{1,3}\s*\/\s*\d{2,4}\s*$/,
  /^\s*P[aá]gina\s+\d{1,4}(\s+de\s+\d+)?\s*$/i,
]

/**
 * Prefijos repetidos al inicio del bloque (pdf2htmlEX parte palabras con espacios raros).
 * Se aplican en bucle hasta que ninguno coincida.
 */
const STRIP_LEADING_PATTERNS = [
  /^de\s+Pol[ií]tica\s+y\s+Seguridad\s+Vial\s+\d+\s+/i,
  /^BA\s+TER[IÍ]A\s+DE\s+PREGUNT\s*AS\s+Y\s+RESPUEST\s*AS\s+/i,
  /^Anex\s*o\s*I:\s*Preguntas\s+Examen\s+T\s*e[óo]rico\s+Licencia\s+de\s+Conducir\s+/i,
  /^Bater[ií]a\s+de\s+pr\s*eguntas\s+y\s+respuestas\s+/i,
  /^PREGUNT\s*AS\s+GENERALES:\s*CONVIVIENCIA\s+SEGURA\s+EN\s+EL\s+TR[ÁA]NSITO\s+/i,
  /^Pr\s*eguntas\s+par\s+a\s+todas\s+las\s+clases:\s+actor\s+es\s+en\s+la\s+via\s+publica\s+/i,
]

/** Restos de V/F que a veces quedan pegados al enunciado antes de la pregunta real */
const STRIP_ORPHAN_VF = /\s*•\s*V\s*erdader\s*o\.?\s*•\s*F\s*also\.?\s*/gi

/** Numeración de ítem del examen (1) 2) 15)), no confundir con A. B. C. */
function stripLeadingNumericQuestionId(s) {
  return s.replace(/^(?:\d{1,4}\)\s*)+/g, "").trim()
}

function normalizeSpaces(s) {
  return s.replace(SOFT_HYPHEN, "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "")
}

function filterNoiseLines(text) {
  const lines = text.split(/\n/)
  const kept = lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !LINE_IS_ONLY_NOISE.some((re) => re.test(l)))
  return kept.join("\n")
}

function stripLeadingRepeated(s) {
  let cur = s
  let guard = 0
  while (guard < 24) {
    guard += 1
    let next = cur
    for (const re of STRIP_LEADING_PATTERNS) {
      next = next.replace(re, "")
    }
    next = normalizeSpaces(next)
    if (next === cur) break
    cur = next
  }
  return cur
}

/**
 * @param {string} text
 * @param {{ stripOrphanVf?: boolean }} [opts]
 */
export function cleanExamText(text, opts = {}) {
  const stripOrphanVf = opts.stripOrphanVf !== false
  if (text == null || typeof text !== "string") return ""
  let s = text.replace(SOFT_HYPHEN, "")
  s = filterNoiseLines(s)
  s = stripLeadingRepeated(s)
  if (stripOrphanVf) s = s.replace(STRIP_ORPHAN_VF, " ")
  s = normalizeSpaces(s)
  s = stripLeadingNumericQuestionId(s)
  return s
}
