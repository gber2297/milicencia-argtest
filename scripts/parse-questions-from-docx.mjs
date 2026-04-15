/**
 * Extrae preguntas desde cuestionario.docx (OOXML).
 * - Respuesta correcta: texto con w:color @val = 90C852 (verde), NO usa highlight ni sombreado de fondo.
 * - Segmentacion: enunciado (texto + imagenes embebidas) hasta A. / V-F, luego bloque de opciones.
 *
 * Uso: node scripts/parse-questions-from-docx.mjs
 *   DOCX_PATH=ruta.docx OUTPUT_PATH=tmp/out.json
 */

import fs from "node:fs/promises"
import path from "node:path"

import { XMLParser } from "fast-xml-parser"
import JSZip from "jszip"

const DOCX_PATH = path.resolve(process.env.DOCX_PATH ?? "cuestionario.docx")
const OUTPUT_PATH = path.resolve(process.env.OUTPUT_QUESTIONS_DOCX ?? "tmp/questions-from-docx.json")
const MEDIA_OUT = path.resolve("tmp/docx-media")

const GREEN_ANSWER = new Set(["90c852", "92d050", "00b050"])

function cleanLine(line) {
  return line.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "")
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

function asArray(x) {
  if (x == null) return []
  return Array.isArray(x) ? x : [x]
}

function extractTText(t) {
  if (t == null) return ""
  const parts = asArray(t)
  let s = ""
  for (const p of parts) {
    if (typeof p === "string") s += p
    else if (p && p["#text"] != null) s += p["#text"]
  }
  return s
}

function colorFromRPrArray(rPrArr) {
  if (!Array.isArray(rPrArr)) return null
  for (const it of rPrArr) {
    if (it.color !== undefined && it[":@"]?.["@_val"]) return String(it[":@"]["@_val"])
  }
  return null
}

function extractRunColor(runChunks) {
  let color = null
  for (const ch of runChunks) {
    const key = Object.keys(ch)[0]
    if (key !== "rPr") continue
    const c = colorFromRPrArray(ch.rPr)
    if (c) color = c
  }
  return color
}

/** Solo color de fuente (w:color); NO highlight ni shd para marcar correcta */
function isGreenAnswerColor(hex) {
  if (!hex) return false
  return GREEN_ANSWER.has(hex.toLowerCase())
}

function collectEmbedIds(node, out) {
  if (node == null) return
  if (typeof node !== "object") return
  if (Array.isArray(node)) {
    for (const x of node) collectEmbedIds(x, out)
    return
  }
  if (node[":@"]?.["@_embed"]) out.push(String(node[":@"]["@_embed"]))
  for (const v of Object.values(node)) collectEmbedIds(v, out)
}

function extractOneRun(runChunks) {
  const chunks = asArray(runChunks).filter(Boolean)
  let text = ""
  const embedIds = []
  let hasDrawing = false
  for (const chunk of chunks) {
    const key = Object.keys(chunk)[0]
    if (key === "t") text += extractTText(chunk.t)
    if (key === "tab") text += " "
    if (key === "br") text += "\n"
    if (key === "drawing" || key === "AlternateContent") {
      hasDrawing = true
      collectEmbedIds(chunk[key], embedIds)
    }
  }
  const colorHex = extractRunColor(chunks)
  const hasGreenText = isGreenAnswerColor(colorHex)
  return {
    text,
    colorHex,
    hasGreenText,
    hasDrawing,
    embedIds: [...new Set(embedIds)],
  }
}

function walkP(pArr, sink) {
  for (const part of asArray(pArr)) {
    const key = Object.keys(part)[0]
    if (key === "r") sink.push(extractOneRun(part.r))
  }
}

function walkTcContent(tc) {
  const runs = []
  for (const cell of asArray(tc)) {
    const key = Object.keys(cell)[0]
    if (key === "p") walkP(cell.p, runs)
    if (key === "tbl") walkTbl(cell.tbl, runs)
  }
  return runs
}

function walkTr(trBlock) {
  const runs = []
  for (const item of asArray(trBlock)) {
    const key = Object.keys(item)[0]
    if (key === "tc") runs.push(...walkTcContent(item.tc))
  }
  return runs
}

function walkTbl(tblArr, sink) {
  for (const el of asArray(tblArr)) {
    const key = Object.keys(el)[0]
    if (key === "tr") sink.push(...walkTr(el.tr))
  }
}

function extractRunsInOrder(body) {
  const runs = []
  for (const el of asArray(body)) {
    const key = Object.keys(el)[0]
    if (key === "p") {
      walkP(el.p, runs)
      runs.push({ type: "paraBreak" })
    } else if (key === "tbl") {
      const tblRuns = []
      walkTbl(el.tbl, tblRuns)
      runs.push(...tblRuns)
      runs.push({ type: "paraBreak" })
    }
  }
  while (runs.length && runs[runs.length - 1]?.type === "paraBreak") runs.pop()
  return runs
}

/** Un parrafo = una linea logica (como un bloque de texto); el parser de opciones une continuaciones. */
function paragraphRunsToLines(rawRuns) {
  const lines = []
  let cur = []
  for (const r of rawRuns) {
    if (r.type === "paraBreak") {
      if (cur.length) lines.push(mergeRunGroup(cur))
      cur = []
      continue
    }
    cur.push(r)
  }
  if (cur.length) lines.push(mergeRunGroup(cur))
  return lines.filter((ln) => ln.clean.length > 0 || ln.embedIds?.length || ln.hasDrawing)
}

function mergeRunGroup(runArr) {
  const clean = cleanLine(runArr.map((r) => r.text || "").join(" "))
  const hasGreenText = runArr.some((r) => r.hasGreenText)
  const embedIds = [...new Set(runArr.flatMap((r) => r.embedIds || []))]
  const hasDrawing = runArr.some((r) => r.hasDrawing)
  return { clean, runs: runArr, hasGreenText, hasDrawing, embedIds }
}

async function parseRelationships(xml) {
  if (!xml) return new Map()
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" })
  const doc = parser.parse(xml)
  const rels = asArray(doc?.Relationships?.Relationship)
  const map = new Map()
  for (const rel of rels) {
    const id = rel["@_Id"]
    const target = rel["@_Target"]
    if (id && target) map.set(id, target.replace(/^\//, ""))
  }
  return map
}

async function extractMediaZip(zip, relById) {
  await fs.mkdir(MEDIA_OUT, { recursive: true })
  const prefix = "word/"
  const mediaFiles = Object.keys(zip.files).filter((n) => n.startsWith(`${prefix}media/`) && !n.endsWith("/"))
  const rIdToPath = new Map()
  for (const [rid, target] of relById) {
    const full = target.startsWith("word/") ? target : `${prefix}${target.replace(/^word\//, "")}`
    rIdToPath.set(rid, full)
  }
  const written = new Map()
  for (const mf of mediaFiles) {
    const f = zip.file(mf)
    if (!f) continue
    const base = path.basename(mf)
    const dest = path.join(MEDIA_OUT, base)
    const buf = await f.async("nodebuffer")
    await fs.writeFile(dest, buf)
    written.set(mf, `tmp/docx-media/${base}`)
  }
  return { rIdToPath, writtenPathByZip: written }
}

function resolveEmbedToRelPath(embedId, rIdToPath, writtenPathByZip) {
  const zipPath = rIdToPath.get(embedId)
  if (!zipPath) return null
  const base = path.basename(zipPath)
  return `tmp/docx-media/${base}`
}

function extractSourceNumber(stemText) {
  const m = stemText.match(/(\d{1,4})\)\s/)
  return m ? Number(m[1]) : null
}

function isMcOptionStart(text) {
  return /^\s*A[\.\)]\s*/i.test(text)
}

/** Inicio de bloque V/F: viñeta + Verdadero/Falso, o línea que empieza con Verdadero (pares Verdadero → Falso en el DOCX). */
function isVfQuestionStart(text) {
  if (/^\s*[•\-]\s*(Verdadero|Falso)/i.test(text)) return true
  return /^\s*Verdadero\b/i.test(text)
}

function parseAbcdOptionBlock(runs, startIdx) {
  const options = []
  let i = startIdx
  const order = ["A", "B", "C", "D"]
  const lineText = (row) => row.clean ?? row.text ?? ""
  for (let li = 0; li < order.length; li += 1) {
    const letter = order[li]
    if (i >= runs.length) break
    const line = lineText(runs[i])
    const m = line.match(new RegExp(`^\\s*${letter}[\\.\\)]\\s*(.*)$`, "is"))
    if (!m) {
      if (letter === "D" && /^\s*A[\.\)]\s/i.test(line))
        return { options, nextIdx: i, ok: options.length >= 2 }
      return { options, nextIdx: i, ok: options.length >= 2 }
    }
    let body = m[1] ?? ""
    let isCorrect = runs[i].hasGreenText
    i += 1
    while (i < runs.length) {
      const nl = lineText(runs[i])
      if (/^\s*[A-D][\.\)]\s/i.test(nl)) break
      body = `${body} ${nl}`.trim()
      if (runs[i].hasGreenText) isCorrect = true
      i += 1
    }
    options.push({
      letter,
      option_text: cleanLine(body),
      is_correct: isCorrect,
      source_letter: letter,
    })
    if (letter === "C" && i < runs.length && /^\s*A[\.\)]\s/i.test(lineText(runs[i])))
      return { options, nextIdx: i, ok: options.length >= 2 }
  }
  return { options, nextIdx: i, ok: options.length >= 2 }
}

function parseVfOptionBlock(runs, startIdx) {
  const options = []
  let i = startIdx
  const lineText = (row) => row.clean ?? row.text ?? ""

  /** Siguiente línea = opción Falso o bloque distinto (no mezclar con otro Verdadero) */
  function breaksVerdaderoContinuation(nl) {
    return /^\s*Falso\b/i.test(nl) || isMcOptionStart(nl)
  }
  function breaksFalsoContinuation(nl) {
    return /^\s*Verdadero\b/i.test(nl) || isMcOptionStart(nl)
  }

  for (let round = 0; round < 2; round += 1) {
    if (i >= runs.length) return { options, nextIdx: startIdx, ok: false }
    const line = lineText(runs[i])
    const m = line.match(/^\s*(?:[•\-]\s*)?(Verdadero|Falso)\b\.?(.*)$/i)
    if (!m) return { options, nextIdx: i, ok: false }
    if (round === 0 && m[1].toLowerCase() !== "verdadero")
      return { options, nextIdx: i, ok: false }
    if (round === 1 && m[1].toLowerCase() !== "falso") return { options, nextIdx: i, ok: false }

    let body = cleanLine(`${m[1]}${m[2] ? ` ${m[2]}` : ""}`)
    let isCorrect = runs[i].hasGreenText
    i += 1
    while (i < runs.length) {
      const nl = lineText(runs[i])
      if (round === 0 && breaksVerdaderoContinuation(nl)) break
      if (round === 1 && breaksFalsoContinuation(nl)) break
      body = `${body} ${nl}`.trim()
      if (runs[i].hasGreenText) isCorrect = true
      i += 1
    }
    options.push({
      letter: round === 0 ? "A" : "B",
      option_text: body,
      is_correct: isCorrect,
      source_letter: round === 0 ? "A" : "B",
    })
  }
  return { options, nextIdx: i, ok: options.length === 2 }
}

function splitStemTextAndImages(stemLines, resolveEmb) {
  const textParts = []
  const images = []
  for (const ln of stemLines) {
    for (const id of ln.embedIds || []) {
      const p = resolveEmb(id)
      if (p) images.push(p)
    }
    if (ln.clean) textParts.push(ln.clean)
  }
  return {
    question_text: cleanLine(textParts.join(" ")),
    question_images: [...new Set(images)],
  }
}

/**
 * Primera linea del enunciado antes de las opciones: prioriza linea con ¿; si no, la ultima que cierra con ? o :;
 * no baja de minLine (cursor del documento ya consumido).
 */
function findStemStartLineIndex(lines, optionStartIndex, minLine) {
  const low = Math.max(0, minLine)
  let j = optionStartIndex - 1
  if (j < low) return low
  for (let t = j; t >= low; t--) {
    if (/^\s*¿/.test(lines[t].clean)) return t
  }
  for (let t = j; t >= low; t--) {
    if (/[?:]\s*$/.test(lines[t].clean.trim())) return t
  }
  return Math.max(low, optionStartIndex - 1)
}

function findNextMcOptionIndex(lines, cursor) {
  for (let k = cursor; k < lines.length; k++) {
    if (!isMcOptionStart(lines[k].clean)) continue
    return k
  }
  return -1
}

function findNextVfOptionIndex(lines, cursor) {
  for (let k = cursor; k < lines.length; k++) {
    if (!isVfQuestionStart(lines[k].clean)) continue
    return k
  }
  return -1
}

function parseDocxLines(lines, resolveEmb) {
  const questions = []
  const rejected = []
  let cursor = 0
  let autoNum = 0

  while (cursor < lines.length) {
    let mcIdx = findNextMcOptionIndex(lines, cursor)
    let vfIdx = findNextVfOptionIndex(lines, cursor)
    let kind = null
    let optIdx = -1
    if (mcIdx >= 0 && (vfIdx < 0 || mcIdx <= vfIdx)) {
      kind = "mc"
      optIdx = mcIdx
    } else if (vfIdx >= 0) {
      kind = "vf"
      optIdx = vfIdx
    } else break

    const stemStart = Math.max(cursor, findStemStartLineIndex(lines, optIdx, cursor))
    const stemLines = lines.slice(stemStart, optIdx)
    const stemJoined = stemLines.map((l) => l.clean).join(" ")
    const { question_text, question_images } = splitStemTextAndImages(stemLines, resolveEmb)

    if (kind === "mc") {
      const { options, nextIdx, ok } = parseAbcdOptionBlock(lines, optIdx)
      if (!ok || options.length < 2) {
        rejected.push({
          source_number: extractSourceNumber(stemJoined),
          reason: "docx-mc-incomplete",
          at_line: optIdx,
        })
        cursor = optIdx + 1
        continue
      }
      const sourceNum = extractSourceNumber(stemJoined) ?? (autoNum += 1)
      const corrects = options.filter((o) => o.is_correct)
      let correctLetter = null
      let detection = "docx-no-green-text-on-options"
      if (corrects.length === 1) {
        correctLetter = corrects[0].letter
        detection = "docx-w-color-green-text"
      } else if (corrects.length > 1) detection = "docx-ambiguous-multiple-green"

      questions.push({
        source_number: sourceNum,
        question_text: question_text || cleanLine(stemJoined),
        question_images,
        has_question_image: question_images.length > 0,
        explanation:
          "Importada desde DOCX. Correcta = texto con color de fuente verde (w:color 90C852); no se usa sombreado de fondo (w:shd) ni solo highlight.",
        difficulty: classifyDifficulty({ questionText: question_text || stemJoined }),
        correct_option_letter: correctLetter,
        correct_option_detection: detection,
        options: options.map((o) => ({
          option_text: o.option_text,
          is_correct: correctLetter ? o.source_letter === correctLetter : !!o.is_correct,
          source_letter: o.source_letter,
        })),
      })
      cursor = nextIdx
      continue
    }

    const { options, nextIdx, ok } = parseVfOptionBlock(lines, optIdx)
    if (!ok || options.length < 2) {
      rejected.push({
        source_number: extractSourceNumber(stemJoined),
        reason: "docx-vf-incomplete",
        at_line: optIdx,
      })
      cursor = optIdx + 1
      continue
    }
    const sourceNum = extractSourceNumber(stemJoined) ?? (autoNum += 1)
    const corrects = options.filter((o) => o.is_correct)
    let correctLetter = null
    let detection = "docx-no-green-text-on-options"
    if (corrects.length === 1) {
      correctLetter = corrects[0].letter
      detection = "docx-w-color-green-text"
    } else if (corrects.length > 1) detection = "docx-ambiguous-multiple-green"

    questions.push({
      source_number: sourceNum,
      question_text: question_text || cleanLine(stemJoined),
      question_images,
      has_question_image: question_images.length > 0,
      explanation:
        "Importada desde DOCX. Correcta = texto verde (w:color); no confundir con fondo verde.",
      difficulty: classifyDifficulty({ questionText: question_text || stemJoined }),
      correct_option_letter: correctLetter,
      correct_option_detection: detection,
      options: options.map((o) => ({
        option_text: o.option_text,
        is_correct: correctLetter ? o.source_letter === correctLetter : !!o.is_correct,
        source_letter: o.source_letter,
      })),
    })
    cursor = nextIdx
  }

  return { questions, rejected }
}

async function run() {
  let buf
  try {
    buf = await fs.readFile(DOCX_PATH)
  } catch {
    console.error(`No se encontro: ${DOCX_PATH}`)
    process.exit(1)
  }

  const zip = await JSZip.loadAsync(buf)
  const documentXml = await zip.file("word/document.xml")?.async("string")
  const relsXml = await zip.file("word/_rels/document.xml.rels")?.async("string")
  if (!documentXml) {
    console.error("word/document.xml no encontrado")
    process.exit(1)
  }

  const relById = await parseRelationships(relsXml)
  const { rIdToPath } = await extractMediaZip(zip, relById)

  const parser = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
  })
  const root = parser.parse(documentXml)
  const docNode = root.find((x) => x.document)?.document
  const body = docNode?.[0]?.body
  if (!body) {
    console.error("document/body no encontrado")
    process.exit(1)
  }

  const rawRuns = extractRunsInOrder(body)
  const mergedRuns = paragraphRunsToLines(rawRuns)

  const resolveEmb = (embedId) => {
    const zp = rIdToPath.get(embedId)
    if (!zp) return null
    const base = path.basename(zp)
    return `tmp/docx-media/${base}`
  }

  const { questions, rejected } = parseDocxLines(mergedRuns, resolveEmb)

  const dedupMap = new Map()
  for (const question of questions) {
    const key = question.question_text.toLowerCase()
    if (!dedupMap.has(key)) dedupMap.set(key, question)
  }
  const unique = [...dedupMap.values()]
  const withCorrect = unique.filter((q) => q.correct_option_letter != null).length

  const payload = {
    generated_at: new Date().toISOString(),
    source_docx: path.relative(process.cwd(), DOCX_PATH),
    total_questions: questions.length,
    total_unique: unique.length,
    total_with_correct_green: withCorrect,
    total_rejected: rejected.length,
    questions: unique,
    rejected,
    notes: [
      "Correcta: solo si el run tiene w:color (texto verde), tipicamente 90C852; no se interpreta highlight ni w:shd.",
      "Orden: enunciado e imagenes embebidas antes del primer A. o bullet V/F; luego opciones.",
      "Imagenes copiadas a tmp/docx-media/; question_images lista rutas relativas al proyecto.",
    ],
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8")

  console.log(`DOCX: ${DOCX_PATH}`)
  console.log(`Preguntas: ${questions.length} · unicas: ${unique.length} · con verde opcion: ${withCorrect}`)
  console.log(`Rechazadas: ${rejected.length}`)
  console.log(`JSON: ${OUTPUT_PATH}`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
