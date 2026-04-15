/**
 * Lee tmp/questions-from-html.json (parse-questions-from-html.mjs).
 * Ese JSON ya trae preguntas unicas (dedup por texto de enunciado en el parser HTML).
 */
import fs from "node:fs/promises"
import path from "node:path"

const INPUT = path.resolve("tmp/questions-from-html.json")
const OUTPUT = path.resolve("cuestionario-compilado.json")

async function run() {
  const raw = JSON.parse(await fs.readFile(INPUT, "utf8"))
  const list = raw.questions ?? []

  const sorted = [...list].sort((a, b) => {
    const pa = a.source_page ?? 0
    const pb = b.source_page ?? 0
    if (pa !== pb) return pa - pb
    return (a.source_number ?? 0) - (b.source_number ?? 0)
  })

  const preguntas = sorted.map((q, idx) => ({
    id: idx + 1,
    texto: q.question_text ?? "",
    imagen_pagina: q.source_page_image ?? null,
    pagina_fuente: q.source_page ?? null,
    numero_fuente: q.source_number ?? null,
    opciones: (q.options ?? []).map((o) => ({
      letra: o.source_letter,
      texto: o.option_text,
      es_correcta: !!o.is_correct,
    })),
    respuestas_correctas:
      Array.isArray(q.correct_option_letters) && q.correct_option_letters.length > 0
        ? q.correct_option_letters
        : q.correct_option_letter
          ? [q.correct_option_letter]
          : [],
    deteccion_correcta: q.correct_option_detection ?? null,
    dificultad: q.difficulty ?? null,
  }))

  const conCorrecta = preguntas.filter((p) => (p.respuestas_correctas ?? []).length > 0).length

  const payload = {
    titulo: "Preguntas examen teórico — Licencia de conducir (fuente HTML/pdf2htmlEX)",
    generado: new Date().toISOString(),
    fuente_principal: raw.source_html ?? "cuestionario.html",
    notas: [
      "Las respuestas correctas se infieren de la clase CSS fc2 en el HTML exportado (texto verde en el PDF original).",
      "imagen_pagina apunta a PNG extraídos del mismo cuestionario (ejecutar npm run extract:cuestionario-images si faltan).",
      "Si hay múltiples opciones verdes, se completa respuestas_correctas con todas las letras detectadas.",
    ],
    estadisticas: {
      preguntas_en_fuente_html: raw.total_questions,
      preguntas_unicas_dedup: preguntas.length,
      con_respuesta_correcta: conCorrecta,
      sin_respuesta_correcta: preguntas.length - conCorrecta,
    },
    preguntas,
  }

  await fs.writeFile(OUTPUT, JSON.stringify(payload, null, 2), "utf8")
  console.log(`Escrito: ${OUTPUT}`)
  console.log(`Únicas: ${preguntas.length} (${conCorrecta} con letra correcta)`)
}

run().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
