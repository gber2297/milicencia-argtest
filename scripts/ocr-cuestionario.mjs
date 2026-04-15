import fs from "node:fs/promises"
import path from "node:path"

import { createWorker } from "tesseract.js"

const IMAGES_DIR = path.resolve("tmp/cuestionario-images")
const OUTPUT_DIR = path.resolve("tmp/cuestionario-ocr")
const MANIFEST_PATH = path.join(IMAGES_DIR, "manifest.json")

function getArg(name) {
  const key = `--${name}`
  const found = process.argv.find((arg) => arg === key || arg.startsWith(`${key}=`))
  if (!found) return null
  const [, value] = found.split("=")
  return value ?? "true"
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

function normalizeText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

async function run() {
  const manifestRaw = await fs.readFile(MANIFEST_PATH, "utf8")
  const parsedManifest = JSON.parse(manifestRaw)
  const limitArg = getArg("limit")
  const limit = limitArg ? Number(limitArg) : null
  const manifest = limit ? parsedManifest.slice(0, limit) : parsedManifest
  if (!Array.isArray(manifest) || !manifest.length) {
    throw new Error("Manifest vacio. Ejecuta primero extract:cuestionario-images")
  }

  await ensureDir(OUTPUT_DIR)
  const worker = await createWorker("spa")

  const pages = []
  const fullTextSections = []
  for (const page of manifest) {
    const imagePath = path.join(IMAGES_DIR, page.fileName)
    const {
      data: { text, confidence },
    } = await worker.recognize(imagePath)

    const normalized = normalizeText(text)
    const txtFileName = page.fileName.replace(/\.png$/i, ".txt")
    await fs.writeFile(path.join(OUTPUT_DIR, txtFileName), normalized, "utf8")
    fullTextSections.push(`===== PAGE ${page.pageNo} (${page.fileName}) =====\n${normalized}\n`)

    pages.push({
      ...page,
      txtFileName,
      confidence,
      textLength: normalized.length,
    })

    console.log(`OCR ${page.fileName} -> ${txtFileName} (conf: ${confidence.toFixed(2)})`)
  }

  await worker.terminate()
  await fs.writeFile(path.join(OUTPUT_DIR, "manifest-ocr.json"), JSON.stringify(pages, null, 2), "utf8")
  await fs.writeFile(
    path.join(OUTPUT_DIR, "all-pages.txt"),
    fullTextSections.join("\n"),
    "utf8",
  )

  console.log(`OCR finalizado. Paginas procesadas: ${pages.length}`)
  console.log(`Salida: ${OUTPUT_DIR}`)
}

run().catch((error) => {
  console.error("Error en OCR:", error)
  process.exitCode = 1
})
