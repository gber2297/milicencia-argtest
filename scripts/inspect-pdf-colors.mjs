import path from "node:path"

import PDFParser from "pdf2json"

const INPUT = path.resolve("cuestionario.pdf")

function decodeText(encoded) {
  try {
    return decodeURIComponent(encoded)
  } catch {
    return encoded
  }
}

async function run() {
  const parser = new PDFParser(undefined, true)

  const data = await new Promise((resolve, reject) => {
    parser.on("pdfParser_dataError", (error) => reject(error.parserError))
    parser.on("pdfParser_dataReady", (pdfData) => resolve(pdfData))
    parser.loadPDF(INPUT)
  })

  const pages = data.Pages ?? []
  const firstRichPages = []

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index]
    const texts = page.Texts ?? []
    const decoded = texts
      .map((entry) => {
        const run = entry.R?.[0]
        if (!run) return null
        return {
          text: decodeText(run.T ?? ""),
          color: run.oc ?? null,
          ts: run.TS ?? null,
        }
      })
      .filter(Boolean)

    const withPotentialColor = decoded.filter((item) => item.color !== null)
    if (withPotentialColor.length > 0 && firstRichPages.length < 5) {
      firstRichPages.push({
        page: index + 1,
        sample: withPotentialColor.slice(0, 20),
      })
    }
  }

  console.log(JSON.stringify({ totalPages: pages.length, sampleColoredText: firstRichPages }, null, 2))
}

run().catch((error) => {
  console.error("Error inspeccionando colores del PDF:", error)
  process.exitCode = 1
})
