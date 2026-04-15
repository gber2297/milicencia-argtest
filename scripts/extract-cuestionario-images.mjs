import fs from "node:fs/promises"
import path from "node:path"

const INPUT_HTML = path.resolve("cuestionario.html")
const OUTPUT_DIR = path.resolve("tmp/cuestionario-images")

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

function pad(num, length = 4) {
  return String(num).padStart(length, "0")
}

async function main() {
  const html = await fs.readFile(INPUT_HTML, "utf8")
  const pageRegex = /<div id="pf[^"]*"[^>]*data-page-no="([^"]+)"[\s\S]*?<img[^>]+src="data:image\/png;base64,([^"]+)"/g

  await ensureDir(OUTPUT_DIR)
  const manifest = []

  let match
  let index = 1
  while ((match = pageRegex.exec(html)) !== null) {
    const pageNo = match[1]
    const base64 = match[2]
    const fileName = `page-${pad(index)}-${pageNo}.png`
    const outputPath = path.join(OUTPUT_DIR, fileName)
    const buffer = Buffer.from(base64, "base64")
    await fs.writeFile(outputPath, buffer)

    manifest.push({
      index,
      pageNo,
      fileName,
      bytes: buffer.length,
    })
    index += 1
  }

  const manifestPath = path.join(OUTPUT_DIR, "manifest.json")
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8")

  if (!manifest.length) {
    console.log("No se detectaron imagenes embebidas en el HTML.")
    return
  }

  console.log(`Imagenes extraidas: ${manifest.length}`)
  console.log(`Salida: ${OUTPUT_DIR}`)
  console.log(`Manifest: ${manifestPath}`)
}

main().catch((error) => {
  console.error("Fallo extrayendo imagenes del cuestionario:", error)
  process.exitCode = 1
})
