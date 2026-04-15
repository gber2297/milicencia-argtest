/**
 * Inspecciona un .docx: texto por run, color (w:color), saltos de parrafo (w:p),
 * e imagenes embebidas (word/media + rels).
 *
 * Uso:
 *   node scripts/inspect-docx.mjs ruta/al/archivo.docx
 *   DOCX_PATH=archivo.docx node scripts/inspect-docx.mjs
 *
 * Salida: tmp/docx-inspect.json + resumen por consola
 */

import fs from "node:fs/promises"
import path from "node:path"

import { XMLParser } from "fast-xml-parser"
import JSZip from "jszip"

const argvPath = process.argv[2]
const DOCX_PATH = path.resolve(process.env.DOCX_PATH ?? argvPath ?? "")
const OUTPUT = path.resolve("tmp/docx-inspect.json")

function asArray(x) {
  if (x == null) return []
  return Array.isArray(x) ? x : [x]
}

function getTextFromT(tNode) {
  if (tNode == null) return ""
  if (typeof tNode === "string") return tNode
  if (tNode["#text"]) return String(tNode["#text"])
  return ""
}

function colorVal(rPr) {
  if (!rPr || typeof rPr !== "object") return null
  const c = rPr.color
  if (!c) return null
  if (typeof c === "object") {
    if (c["@_w:val"] != null) return String(c["@_w:val"])
    if (c["@_val"] != null) return String(c["@_val"])
  }
  return null
}

function emitRun(r, out, paragraphIndex) {
  const t = r.t
  const text = cleanLine(getTextFromT(t))
  const rPr = r.rPr
  const color = colorVal(rPr)
  const br = r.br != null
  if (!text && !br && !color && r.drawing == null) return
  out.push({
    paragraphIndex,
    text,
    colorHex: color,
    lineBreak: br,
    hasDrawing: r.drawing != null,
  })
}

function walkParagraphNode(node, out, paragraphIndex) {
  if (node == null || typeof node !== "object") return
  for (const r of asArray(node.r)) emitRun(r, out, paragraphIndex)
  for (const key of Object.keys(node)) {
    if (key === "r" || key === "pPr") continue
    const child = node[key]
    for (const item of asArray(child)) {
      if (item != null && typeof item === "object") walkParagraphNode(item, out, paragraphIndex)
    }
  }
}

function cleanLine(s) {
  return s.replace(/\s+/g, " ").trim()
}

async function readZipXml(zip, name) {
  const f = zip.file(name)
  if (!f) return null
  return f.async("string")
}

async function listMedia(zip) {
  const names = Object.keys(zip.files).filter((n) => n.startsWith("word/media/") && !n.endsWith("/"))
  return names.sort()
}

function histogramColorsFromBody(body) {
  const hist = new Map()
  function asArr(x) {
    if (x == null) return []
    return Array.isArray(x) ? x : [x]
  }
  function walk(o) {
    if (o == null || typeof o !== "object") return
    const rPr = o.rPr
    if (rPr?.color) {
      const c = rPr.color
      const v = c["@_val"] ?? c["@_w:val"]
      if (v) hist.set(v, (hist.get(v) || 0) + 1)
    }
    for (const k of Object.keys(o)) {
      if (k === "@_" || k === "rPr") continue
      for (const item of asArr(o[k])) walk(item)
    }
  }
  walk(body)
  return [...hist.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex, count]) => ({ hex, count }))
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
    const type = rel["@_Type"]
    if (id) map.set(id, { target, type })
  }
  return map
}

async function run() {
  if (!DOCX_PATH) {
    console.error("Indica el .docx: node scripts/inspect-docx.mjs <archivo.docx>")
    process.exit(1)
  }

  const buf = await fs.readFile(DOCX_PATH)
  const zip = await JSZip.loadAsync(buf)

  const [documentXml, relsXml] = await Promise.all([
    readZipXml(zip, "word/document.xml"),
    readZipXml(zip, "word/_rels/document.xml.rels"),
  ])

  if (!documentXml) {
    console.error("No se encontro word/document.xml dentro del docx")
    process.exit(1)
  }

  const relById = await parseRelationships(relsXml)
  const mediaFiles = await listMedia(zip)

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    trimValues: false,
  })

  const doc = parser.parse(documentXml)
  const body = doc.document?.body
  if (!body) {
    console.error("Estructura document/body no reconocida")
    process.exit(1)
  }

  const colorHistogram = histogramColorsFromBody(body)

  const paragraphs = asArray(body.p)
  const runs = []
  paragraphs.forEach((p, pi) => walkParagraphNode(p, runs, pi))

  const withColor = runs.filter((r) => r.colorHex)
  /** En este cuestionario el verde de respuesta correcta es 90C852 (resto: 231F20 cuerpo, 6D6E71 gris, EE312E rojo). */
  const GREEN_CORRECT = new Set(["90c852", "92d050", "00b050"])
  const greens = withColor.filter((r) => GREEN_CORRECT.has((r.colorHex || "").toLowerCase()))

  const payload = {
    docx: path.relative(process.cwd(), DOCX_PATH),
    paragraphCount: paragraphs.length,
    runSamples: runs.slice(0, 200),
    stats: {
      totalRunsSampled: runs.length,
      runsWithColor: withColor.length,
      runsMarkedGreenCorrect: greens.length,
      colorHistogramFullDocument: colorHistogram.slice(0, 20),
      mediaFilesCount: mediaFiles.length,
      mediaFiles: mediaFiles.slice(0, 30),
    },
    relationships: [...relById.entries()].slice(0, 20).map(([id, v]) => ({ id, ...v })),
    notes: [
      "Los colores en Word suelen ir como hex RGB en w:color/@w:val (sin #).",
      "Las imagenes estan en word/media/; los dibujos en parrafos tienen w:drawing con relaciones a esos archivos.",
      "Este script no interpreta aun preguntas; solo valida que podemos leer color, texto e imagenes.",
    ],
  }

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true })
  await fs.writeFile(OUTPUT, JSON.stringify(payload, null, 2), "utf8")

  console.log(`Archivo: ${DOCX_PATH}`)
  console.log(`Parrafos: ${paragraphs.length} · runs analizados: ${runs.length}`)
  console.log(`Runs con color: ${withColor.length} · runs hex 90C852 (verde): ${greens.length}`)
  console.log(`Ficheros en word/media/: ${mediaFiles.length}`)
  console.log(`Salida: ${OUTPUT}`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
