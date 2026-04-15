/**
 * Cuando el PDF junta la siguiente pregunta al final de una opción (p. ej. "...Ambiental. ¿A qué factor...?"),
 * separamos el enunciado fugado y lo devolvemos para anteponerlo al siguiente bloque.
 *
 * Orden fijo en el PDF: • Verdadero. • Falso. — todo lo que sigue a Falso es otro enunciado.
 */

const PEEL_INVERTED = /^([\s\S]+?)(\.\s+¿[^?]{6,}\?)\s*$/s
const PEEL_INDICHE = /^([\s\S]+?)(\.\s+Indique[^?]{8,}\?)\s*$/is

/** Tras el par Verdadero → Falso, el resto pertenece a la siguiente pregunta (espacios tipo pdf2htmlEX) */
const VF_PAIR_BLOCK =
  /^([\s\S]*?)(•\s*V\s*erdader\s*o\s*\.?\s*•\s*F\s*also\s*\.?\s*)([\s\S]*)$/i

/** Tras línea compacta "V     F", el resto es otra pregunta (mismo criterio que bullet V/F) */
const VF_COMPACT_LINE = /^([\s\S]*?)(\s+V\s+[ \t]*F\s*)([\s\S]*)$/i

export function peelAfterVerdaderoFalsoPair(optionText) {
  const t = optionText.trim()
  let m = t.match(VF_PAIR_BLOCK)
  if (!m) m = t.match(VF_COMPACT_LINE)
  if (!m) return { kept: t, leaked: null }
  const tail = m[3].trim()
  if (tail.length < 5) return { kept: t, leaked: null }
  return { kept: m[1].trim(), leaked: tail }
}

/** Una iteración: texto termina en ". ¿...?" o ". Indique...?" */
export function peelOneLeakedQuestion(optionText) {
  const t = optionText.trim()
  let m = t.match(PEEL_INVERTED)
  if (!m) m = t.match(PEEL_INDICHE)
  if (!m) return { kept: t, leaked: null }
  const before = m[1].trim()
  const qPart = m[2].replace(/^\.\s*/, "").trim()
  if (before.length < 3) return { kept: t, leaked: null }
  return { kept: `${before}.`, leaked: qPart }
}

/** Varias preguntas fugadas en la misma opción (cadena) */
export function peelChainFromOption(optionText) {
  let cur = optionText.trim()
  const leaks = []
  while (cur) {
    const vf = peelAfterVerdaderoFalsoPair(cur)
    if (vf.leaked) {
      leaks.push(vf.leaked)
      cur = vf.kept
      continue
    }
    const { kept, leaked } = peelOneLeakedQuestion(cur)
    if (!leaked) break
    leaks.push(leaked)
    cur = kept
  }
  return { kept: cur, leaks }
}

/**
 * Procesa C → B → A → D (C suele acumular basura).
 * Devuelve opciones recortadas y un único string para el siguiente enunciado.
 */
export function peelLeakedQuestionsFromOptions(options) {
  const order = ["C", "B", "A", "D"]
  const byLetter = Object.fromEntries(options.map((o) => [o.letter, { ...o }]))
  const allLeaks = []

  for (const letter of order) {
    const o = byLetter[letter]
    if (!o?.option_text) continue
    const { kept, leaks } = peelChainFromOption(o.option_text)
    o.option_text = kept
    allLeaks.push(...leaks)
  }

  const out = options.map((o) => byLetter[o.letter])
  const leakedForNextStem = allLeaks.join(" ").trim()
  return { options: out, leakedForNextStem }
}
