import fs from "node:fs/promises"
import path from "node:path"

import { cleanExamText } from "./exam-text-cleanup.mjs"
import {
  peelAfterVerdaderoFalsoPair,
  peelLeakedQuestionsFromOptions,
} from "./segmentation-peel.mjs"

/**
 * Extrae preguntas desde cuestionario.html (pdf2htmlEX).
 * La clase CSS fc2 (color verde en el PDF original ~ rgb(133,207,61)) marca la opcion correcta.
 *
 * Uso: coloca cuestionario.html en la raiz del proyecto o:
 *   QUESTIONARIO_HTML=ruta/al/archivo.html node scripts/parse-questions-from-html.mjs
 */

const HTML_PATH = path.resolve(process.env.QUESTIONARIO_HTML ?? "cuestionario.html")
const OUTPUT_PATH = path.resolve(process.env.OUTPUT_QUESTIONS_HTML ?? "tmp/questions-from-html.json")

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

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ")
}

function unwrapEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function textFromRunInner(inner) {
  const raw = stripTags(inner)
  return cleanLine(unwrapEntities(raw))
}

/**
 * Parte el HTML por pagina pdf2htmlEX (id pf* + data-page-no).
 * El nombre de archivo de extract-cuestionario-images es page-{index}-{dataPageNo}.png (index orden aparicion).
 */
function splitHtmlPages(html) {
  const parts = html.split(/(?=<div\s+id="pf[^"]*"[^>]*data-page-no=)/i)
  const pages = []
  let pageIndex = 0
  for (const part of parts) {
    const m = part.match(/^<div\s+id="pf[^"]*"[^>]*data-page-no="([^"]+)"[^>]*>/i)
    if (!m) continue
    pageIndex += 1
    pages.push({ pageIndex, dataPageNo: m[1], html: part })
  }
  return pages.length ? pages : [{ pageIndex: 1, dataPageNo: "1", html }]
}

function pageImagePath(pageIndex, dataPageNo) {
  return `tmp/cuestionario-images/page-${String(pageIndex).padStart(4, "0")}-${dataPageNo}.png`
}

/** data-page-no en pdf2htmlEX: "12" decimal o "a".."f" como hex de pagina */
function logicalPageFromDataPageNo(dataPageNo) {
  if (!dataPageNo) return null
  if (/^\d+$/.test(dataPageNo)) return Number(dataPageNo)
  if (/^[a-f]$/i.test(dataPageNo)) return parseInt(dataPageNo, 16)
  return null
}

function extractSourceNumber(stemText) {
  const m = stemText.match(/(\d{1,4})\)\s/)
  return m ? Number(m[1]) : null
}

/** Letra + opcional espacio + . o ) — el PDF a veces parte "a" y ")" o deja "a )" */
function isMcOptionStart(text) {
  return /^\s*[a-dA-D]\s*[\.\)]\s/i.test(text)
}

/** "• Verdadero" / "• Falso" (texto completo) */
function isVfOptionStart(text) {
  return /^\s*[•\-]\s*(Verdadero|Falso)/i.test(text)
}

/**
 * Formato compacto del PDF: solo letras V y F (misma línea o dos líneas), orden siempre V → F.
 * Exige F en la siguiente run si V va solo (evita falsos positivos con una "V" suelta).
 */
function isVfCompactAt(runs, idx) {
  if (idx >= runs.length) return false
  const t = runs[idx].text.trim()
  if (/^\s*V\s+[ \t]*F\s*$/i.test(t)) return true
  if (!/^\s*V\s*$/i.test(t)) return false
  if (idx + 1 >= runs.length) return false
  return /^\s*F\s*$/i.test(runs[idx + 1].text.trim())
}

/**
 * Une runs consecutivos hasta formar cabecera "a) ..." / "A. ..." (pdf2htmlEX parte letra y ) ).
 */
function stitchOptionHeaderLine(runs, i) {
  if (i >= runs.length)
    return { line: "", lastIdx: i - 1, hasFc2: false }
  let fc = runs[i].hasFc2
  let lastIdx = i
  let candidate = runs[i].text
  const headerOk = (s) =>
    /^\s*[a-dA-D]\s*[\.\)]\s*/i.test(s.replace(/\s+/g, " ").trim())
  if (headerOk(candidate))
    return { line: candidate, lastIdx, hasFc2: fc }
  for (let j = i + 1; j < Math.min(i + 5, runs.length); j += 1) {
    candidate = `${candidate} ${runs[j].text}`.replace(/\s+/g, " ").trim()
    fc = fc || runs[j].hasFc2
    lastIdx = j
    if (headerOk(candidate))
      return { line: candidate, lastIdx, hasFc2: fc }
  }
  return { line: runs[i].text, lastIdx: i, hasFc2: runs[i].hasFc2 }
}

/**
 * Consume A B C (D opcional). Si tras C sigue A., asume 3 opciones y devuelve nextIdx en esa A.
 * Solo 3 opciones (sin D): se acepta si hay A–C bien formados.
 */
function parseAbcdOptionBlock(runs, startIdx) {
  const options = []
  let i = startIdx
  const order = ["A", "B", "C", "D"]
  const optHeaderRe = (letter, low) =>
    new RegExp(
      `^\\s*[${letter}${low}]\\s*[\\.\\)]\\s*(.*)$`,
      "is",
    )
  for (let li = 0; li < order.length; li += 1) {
    const letter = order[li]
    const low = letter.toLowerCase()
    if (i >= runs.length) break

    const stitched = stitchOptionHeaderLine(runs, i)
    const line = stitched.line
    const m = line.match(optHeaderRe(letter, low))
    if (!m) {
      if (letter === "D")
        return { options, nextIdx: i, ok: options.length >= 2 }
      return { options, nextIdx: i, ok: options.length >= 2 }
    }
    let body = m[1] ?? ""
    let isCorrect = stitched.hasFc2
    i = stitched.lastIdx + 1
    while (i < runs.length) {
      const nl = runs[i].text
      if (/^\s*[a-dA-D]\s*[\.\)]\s/i.test(nl)) break
      body = `${body} ${nl}`.trim()
      if (runs[i].hasFc2) isCorrect = true
      i += 1
    }
    options.push({
      letter,
      option_text: cleanLine(body),
      is_correct: isCorrect,
      source_letter: letter,
    })
    if (letter === "C" && i < runs.length) {
      const nx = stitchOptionHeaderLine(runs, i).line
      if (/^\s*a\s*[\.\)]/i.test(nx))
        return { options, nextIdx: i, ok: options.length >= 2 }
    }
  }
  return { options, nextIdx: i, ok: options.length >= 2 }
}

const ANY_MC_HEADER = /^\s*([a-dA-D])\s*[\.\)]\s*(.*)$/is

/**
 * Segundo intento: opciones en cualquier orden / sin exigir A primero (PDF desordenado o ruido antes de a)).
 */
function parseMcBlockLoose(runs, startIdx) {
  const options = []
  let i = startIdx
  const seen = new Set()
  while (i < runs.length) {
    const stitched = stitchOptionHeaderLine(runs, i)
    const m = stitched.line.match(ANY_MC_HEADER)
    if (!m) break
    const letter = m[1].toUpperCase()
    if (seen.has(letter)) break
    seen.add(letter)
    let body = m[2] ?? ""
    let isCorrect = stitched.hasFc2
    i = stitched.lastIdx + 1
    while (i < runs.length) {
      const nl = runs[i].text
      if (/^\s*[a-dA-D]\s*[\.\)]\s/i.test(nl)) break
      if (isVfOptionStart(nl) || isVfCompactAt(runs, i)) break
      if (/^\s*\d{1,4}\s*[\)\.]\s/.test(nl)) break
      body = `${body} ${nl}`.trim()
      if (runs[i].hasFc2) isCorrect = true
      i += 1
    }
    options.push({
      letter,
      option_text: cleanLine(body),
      is_correct: isCorrect,
      source_letter: letter,
    })
    if (options.length >= 4) break
  }
  return { options, nextIdx: i, ok: options.length >= 2 }
}

/**
 * V/F con letras sueltas: dos runs "V" / "F" o un run "V     F" (correcta por fc2 por run o línea).
 */
function parseVfLetterPairBlock(runs, startIdx) {
  let i = startIdx
  if (i >= runs.length) return { options: [], nextIdx: startIdx, ok: false }
  const line0 = runs[i].text.trim()

  const inline = /^\s*V\s+[ \t]*F\s*$/i.test(line0)
  if (inline) {
    const fc = runs[i].hasFc2
    const options = [
      {
        letter: "A",
        option_text: "Verdadero",
        is_correct: fc,
        source_letter: "A",
      },
      {
        letter: "B",
        option_text: "Falso",
        is_correct: fc,
        source_letter: "B",
      },
    ]
    return { options, nextIdx: i + 1, ok: true }
  }

  if (!/^\s*V\s*$/i.test(line0))
    return { options: [], nextIdx: startIdx, ok: false }

  const vFc = runs[i].hasFc2
  i += 1
  if (i >= runs.length) return { options: [], nextIdx: startIdx, ok: false }
  const line1 = runs[i].text.trim()
  if (!/^\s*F\s*$/i.test(line1))
    return { options: [], nextIdx: startIdx, ok: false }

  const fFc = runs[i].hasFc2
  i += 1
  const options = [
    {
      letter: "A",
      option_text: "Verdadero",
      is_correct: vFc,
      source_letter: "A",
    },
    {
      letter: "B",
      option_text: "Falso",
      is_correct: fFc,
      source_letter: "B",
    },
  ]
  return { options, nextIdx: i, ok: true }
}

function parseVfOptionBlock(runs, startIdx) {
  const options = []
  let i = startIdx
  for (let round = 0; round < 2; round += 1) {
    if (i >= runs.length) return { options, nextIdx: startIdx, ok: false }
    const line = runs[i].text
    const m = line.match(/^\s*[•\-]\s*(Verdadero|Falso)\.?(.*)$/i)
    if (!m) return { options, nextIdx: i, ok: false }
    let body = cleanLine(`${m[1]}${m[2] ? ` ${m[2]}` : ""}`)
    let isCorrect = runs[i].hasFc2
    i += 1
    while (i < runs.length) {
      const nl = runs[i].text
      if (
        /^\s*[•\-]\s*(Verdadero|Falso)/i.test(nl) ||
        isMcOptionStart(nl) ||
        isVfCompactAt(runs, i)
      )
        break
      body = `${body} ${nl}`.trim()
      if (runs[i].hasFc2) isCorrect = true
      i += 1
    }
    options.push({
      letter: round === 0 ? "A" : "B",
      option_text: cleanLine(body),
      is_correct: isCorrect,
      source_letter: round === 0 ? "A" : "B",
    })
  }
  return { options, nextIdx: i, ok: options.length === 2 }
}

function finalizeQuestion({
  stemText,
  effectiveOptions,
  pageIndex,
  dataPageNo,
  sourceNum,
}) {
  const corrects = effectiveOptions.filter((o) => o.is_correct)
  const correctLetters = [...new Set(corrects.map((o) => o.letter))].sort()
  let correctLetter = null
  let detection = "fc2-not-found-on-option-runs"
  if (correctLetters.length === 1) {
    correctLetter = correctLetters[0]
    detection = "html-class-fc2-on-correct-option"
  } else if (correctLetters.length > 1) {
    detection = "multiple-fc2-correct-options"
  }

  const chosenCorrect = new Set(correctLetters)
  const questionText = extractQuestionTextFromSegment(stemText)

  const logicalPage = logicalPageFromDataPageNo(dataPageNo)
  const qFinal = questionText || cleanExamText(cleanLine(stemText))
  return {
    source_page: logicalPage ?? pageIndex,
    page_sequence: pageIndex,
    source_number: sourceNum,
    data_page_no: dataPageNo,
    source_page_image: pageImagePath(pageIndex, dataPageNo),
    question_text: qFinal,
    explanation: "Importada desde HTML (pdf2htmlEX). Segmentacion por bloque A-D / V-F; correcta por fc2.",
    difficulty: classifyDifficulty({ questionText: qFinal || stemText }),
    correct_option_letter: correctLetter,
    correct_option_letters: correctLetters,
    correct_option_detection: detection,
    options: effectiveOptions.map((o) => ({
      option_text: cleanExamText(o.option_text, { stripOrphanVf: false }),
      is_correct: chosenCorrect.size > 0 ? chosenCorrect.has(o.source_letter) : !!o.is_correct,
      source_letter: o.source_letter,
    })),
  }
}

const divTRegex = /<div class="([^"]*)"[^>]*>([\s\S]*?)<\/div>/gi

function extractTextRuns(pageHtml) {
  const runs = []
  let match
  divTRegex.lastIndex = 0
  while ((match = divTRegex.exec(pageHtml)) !== null) {
    const className = match[1]
    if (!/\bt\b/.test(className)) continue
    const inner = match[2]
    if (/<div\b/i.test(inner)) continue
    const text = textFromRunInner(inner)
    if (!text) continue
    const hasFc2 = /\bfc2\b/.test(className)
    runs.push({ text, hasFc2 })
  }
  return runs
}

function extractQuestionTextFromSegment(segment) {
  const pats = [
    /(?:^|\n)\s*[a-dA-D]\s*[\.\)]\s/i,
    /(?:^|\n)\s*[•\-]\s*(Verdadero|Falso)/i,
    /(?:^|\n)\s*V\s*\n\s*F/i,
    /(?:^|\n)\s*V\s+[ \t]*F\s*$/m,
  ]
  let cut = -1
  for (const re of pats) {
    const m = segment.search(re)
    if (m >= 0 && (cut < 0 || m < cut)) cut = m
  }
  const raw = cut < 0 ? segment : segment.slice(0, cut)
  return cleanExamText(cleanLine(raw))
}

/**
 * Segmenta por bloques de respuesta: todo lo anterior a la primera A. / V-F es el enunciado
 * (puede incluir referencia a imagen de pagina). Correcta por fc2 en runs de opcion.
 * prependStem: texto fugado desde la opcion de la pregunta anterior (entre paginas o mismo bloque).
 */
function parsePageRuns(runs, { pageIndex, dataPageNo, prependStem = "" }) {
  const questions = []
  const rejected = []
  let i = 0
  let autoNum = 0
  let nextStemPrepend = prependStem.trim()

  while (i < runs.length) {
    const stemRuns = []
    if (nextStemPrepend) {
      stemRuns.push({ text: nextStemPrepend, hasFc2: false })
      nextStemPrepend = ""
    }
    while (
      i < runs.length &&
      !isMcOptionStart(runs[i].text) &&
      !isVfOptionStart(runs[i].text) &&
      !isVfCompactAt(runs, i)
    ) {
      stemRuns.push(runs[i])
      i += 1
    }
    if (i >= runs.length) break

    const stemText = stemRuns.map((r) => r.text).join("\n")

    if (isMcOptionStart(runs[i].text)) {
      let { options, nextIdx, ok } = parseAbcdOptionBlock(runs, i)
      if (!ok || options.length < 2) {
        const loose = parseMcBlockLoose(runs, i)
        if (loose.ok && loose.options.length >= 2) {
          options = loose.options
          nextIdx = loose.nextIdx
          ok = true
        }
      }
      if (!ok || options.length < 2) {
        rejected.push({
          page: pageIndex,
          source_number: extractSourceNumber(stemText),
          reason: "Bloque A-D incompleto o menos de 2 opciones",
        })
        i += 1
        continue
      }
      const peeled = peelLeakedQuestionsFromOptions(options)
      nextStemPrepend = peeled.leakedForNextStem
      const sourceNum = extractSourceNumber(stemText) ?? (autoNum += 1)
      let q = finalizeQuestion({
        stemText,
        effectiveOptions: peeled.options,
        pageIndex,
        dataPageNo,
        sourceNum,
      })
      const stemVf = peelAfterVerdaderoFalsoPair(q.question_text)
      if (stemVf.leaked) {
        q = {
          ...q,
          question_text: stemVf.kept.trim(),
        }
        nextStemPrepend = [nextStemPrepend, stemVf.leaked].filter(Boolean).join(" ").trim()
      }
      questions.push(q)
      i = nextIdx
      continue
    }

    if (isVfOptionStart(runs[i].text)) {
      const { options, nextIdx, ok } = parseVfOptionBlock(runs, i)
      if (!ok || options.length < 2) {
        rejected.push({
          page: pageIndex,
          source_number: extractSourceNumber(stemText),
          reason: "Bloque Verdadero/Falso incompleto",
        })
        i += 1
        continue
      }
      const peeled = peelLeakedQuestionsFromOptions(options)
      nextStemPrepend = peeled.leakedForNextStem
      const sourceNum = extractSourceNumber(stemText) ?? (autoNum += 1)
      let q = finalizeQuestion({
        stemText,
        effectiveOptions: peeled.options,
        pageIndex,
        dataPageNo,
        sourceNum,
      })
      const stemVf = peelAfterVerdaderoFalsoPair(q.question_text)
      if (stemVf.leaked) {
        q = {
          ...q,
          question_text: stemVf.kept.trim(),
        }
        nextStemPrepend = [nextStemPrepend, stemVf.leaked].filter(Boolean).join(" ").trim()
      }
      questions.push(q)
      i = nextIdx
      continue
    }

    if (isVfCompactAt(runs, i)) {
      const { options, nextIdx, ok } = parseVfLetterPairBlock(runs, i)
      if (!ok || options.length < 2) {
        rejected.push({
          page: pageIndex,
          source_number: extractSourceNumber(stemText),
          reason: "Bloque V/F compacto (V F) incompleto",
        })
        i += 1
        continue
      }
      const peeled = peelLeakedQuestionsFromOptions(options)
      nextStemPrepend = peeled.leakedForNextStem
      const sourceNum = extractSourceNumber(stemText) ?? (autoNum += 1)
      let q = finalizeQuestion({
        stemText,
        effectiveOptions: peeled.options,
        pageIndex,
        dataPageNo,
        sourceNum,
      })
      const stemVf = peelAfterVerdaderoFalsoPair(q.question_text)
      if (stemVf.leaked) {
        q = {
          ...q,
          question_text: stemVf.kept.trim(),
        }
        nextStemPrepend = [nextStemPrepend, stemVf.leaked].filter(Boolean).join(" ").trim()
      }
      questions.push(q)
      i = nextIdx
      continue
    }

    i += 1
  }

  return { questions, rejected, carryPrepend: nextStemPrepend }
}

async function run() {
  let html
  try {
    html = await fs.readFile(HTML_PATH, "utf8")
  } catch {
    console.error(`No se encontro el archivo HTML: ${HTML_PATH}`)
    console.error("Exporta el PDF con pdf2htmlEX o copia cuestionario.html al proyecto.")
    process.exit(1)
  }

  const pages = splitHtmlPages(html)
  const allQuestions = []
  const allRejected = []
  let carryAcrossPages = ""

  for (const { pageIndex, dataPageNo, html: pageHtml } of pages) {
    const runs = extractTextRuns(pageHtml)
    const { questions, rejected, carryPrepend } = parsePageRuns(runs, {
      pageIndex,
      dataPageNo,
      prependStem: carryAcrossPages,
    })
    carryAcrossPages = carryPrepend
    allQuestions.push(...questions)
    allRejected.push(...rejected)
  }

  if (carryAcrossPages) {
    allRejected.push({
      page: null,
      source_number: null,
      reason: "texto-fugado-sobrante-fin-documento",
      detail: carryAcrossPages.slice(0, 500),
    })
  }

  /** Misma pregunta (texto igual) → una entrada; enunciado vacío tras limpieza no debe colapsar todo en uno */
  function dedupKey(q) {
    const t = (q.question_text ?? "").toLowerCase().trim()
    if (t.length > 0) return t
    return `__stem_vacio__seq${q.page_sequence}_n${q.source_number}_p${q.source_page}`
  }

  const dedupMap = new Map()
  for (const question of allQuestions) {
    const key = dedupKey(question)
    if (!dedupMap.has(key)) dedupMap.set(key, question)
  }
  const unique = [...dedupMap.values()]

  const withCorrect = unique.filter(
    (q) =>
      (Array.isArray(q.correct_option_letters) && q.correct_option_letters.length > 0) ||
      q.correct_option_letter != null,
  ).length

  const payload = {
    generated_at: new Date().toISOString(),
    source_html: path.relative(process.cwd(), HTML_PATH),
    total_questions: allQuestions.length,
    total_unique: unique.length,
    total_with_correct_fc2: withCorrect,
    total_rejected: allRejected.length,
    questions: unique,
    rejected: allRejected,
    notes: [
      'En pdf2htmlEX la clase fc2 suele corresponder al color verde de la respuesta correcta (p. ej. color: rgb(133, 207, 61)).',
      "Segmentacion: texto hasta la siguiente A. (multiple choice) o • Verdadero/Falso = enunciado; luego un bloque de opciones.",
      "Imagen de pagina: tmp/cuestionario-images/page-{orden}-{data-page-no}.png alineado con extract-cuestionario-images.mjs.",
      "Limpieza: exam-text-cleanup.mjs quita cabeceras/pies tipicos, soft hyphens y lineas basura (Buenos Aires/Provincia, etc.).",
      "Segmentacion: segmentation-peel.mjs recorta preguntas fugadas al final de opciones (. ¿...? / . Indique...?) y las antepone al siguiente enunciado (tambien entre paginas).",
    ],
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8")

  console.log(`Archivo: ${HTML_PATH}`)
  console.log(`Preguntas extraidas: ${allQuestions.length}`)
  console.log(`Unicas: ${unique.length}`)
  console.log(`Con correcta (fc2): ${withCorrect}`)
  console.log(`Descartadas: ${allRejected.length}`)
  console.log(`Salida: ${OUTPUT_PATH}`)
}

run().catch((error) => {
  console.error("Error parseando HTML:", error)
  process.exitCode = 1
})
