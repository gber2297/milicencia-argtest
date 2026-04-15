import fs from "node:fs/promises"
import path from "node:path"

const INPUT = path.resolve("tmp/questions-from-html.json")
const OUTPUT = path.resolve("tmp/preview-questions-10.html")

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

async function run() {
  const raw = await fs.readFile(INPUT, "utf8")
  const data = JSON.parse(raw)
  const all = Array.isArray(data.questions) ? data.questions : []
  const isCleanQuestion = (q) => {
    const options = Array.isArray(q.options) ? q.options : []
    if (options.length < 2 || options.length > 4) return false
    if (typeof q.question_text !== "string" || q.question_text.trim().length < 20) return false
    const letters = options.map((o) => (o.source_letter || "").toUpperCase())
    const unique = new Set(letters)
    if (unique.size !== options.length) return false
    return true
  }

  const preferred = all.filter(
    (q) =>
      q.correct_option_detection === "html-class-fc2-on-correct-option" &&
      isCleanQuestion(q),
  )
  const fallback = all.filter(isCleanQuestion)
  const picked = preferred.length >= 10 ? preferred : [...preferred, ...fallback]
  const list = picked.slice(0, 10)

  const items = []
  for (let i = 0; i < list.length; i += 1) {
    const q = list[i]
    const imgRel =
      q.source_page_image && typeof q.source_page_image === "string"
        ? q.source_page_image.replace(/^tmp\//, "./")
        : null
    let imgExists = false
    if (imgRel) {
      const abs = path.resolve(path.dirname(OUTPUT), imgRel)
      try {
        await fs.access(abs)
        imgExists = true
      } catch {
        imgExists = false
      }
    }

    const optionRows = (Array.isArray(q.options) ? q.options : []).map((o, idx) => {
      const letter = o.source_letter ?? String.fromCharCode(65 + idx)
      const correct = !!o.is_correct
      return `<li class="opt${correct ? " opt-correct" : ""}"><span class="opt-letter">${esc(
        letter,
      )}.</span> ${esc(o.option_text)}</li>`
    })

    items.push(`<article class="card">
  <header class="card-head">
    <span class="badge">#${i + 1}</span>
    <span class="meta">pág. ${esc(q.source_page)} · nº ${esc(q.source_number)} · ${
      esc(q.difficulty || "?")
    }</span>
  </header>
  <p class="detection">${esc(q.correct_option_detection)} · correcta: ${
      q.correct_option_letter != null ? esc(q.correct_option_letter) : "—"
    }</p>
  <div class="stem">${esc(q.question_text)}</div>
  <ol class="opts">${optionRows.join("")}</ol>
  ${
    imgExists && imgRel
      ? `<figure class="fig"><img src="${esc(imgRel)}" alt="Página ${esc(q.source_page)}" loading="lazy" /><figcaption>${esc(
          imgRel,
        )}</figcaption></figure>`
      : imgRel
        ? `<p class="missing">Imagen no encontrada: ${esc(imgRel)}</p>`
        : ""
  }
</article>`)
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vista previa — 10 preguntas (${esc(data.source_html || "questions-from-html.json")})</title>
  <style>
    :root { font-family: system-ui, sans-serif; background: #f4f4f5; color: #18181b; }
    body { max-width: 52rem; margin: 0 auto; padding: 1.25rem 1rem 3rem; }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
    .src { font-size: 0.85rem; color: #71717a; margin-bottom: 1.5rem; }
    .card {
      background: #fff;
      border-radius: 10px;
      padding: 1rem 1.1rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
    }
    .card-head { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.35rem; }
    .badge { background: #18181b; color: #fff; font-size: 0.75rem; padding: 0.15rem 0.45rem; border-radius: 6px; }
    .meta { font-size: 0.8rem; color: #52525b; }
    .detection { font-size: 0.78rem; color: #a16207; background: #fef9c3; padding: 0.35rem 0.5rem; border-radius: 6px; margin: 0 0 0.75rem; }
    .stem { white-space: pre-wrap; line-height: 1.45; margin-bottom: 0.75rem; }
    .opts { margin: 0; padding-left: 0; list-style: none; counter-reset: opt; }
    .opt { padding: 0.45rem 0.5rem; border-radius: 6px; margin-bottom: 0.35rem; border: 1px solid #e4e4e7; }
    .opt-correct { border-color: rgb(133, 207, 61); background: rgba(133, 207, 61, 0.12); }
    .opt-letter { font-weight: 600; margin-right: 0.25rem; }
    .fig { margin: 0.75rem 0 0; }
    .fig img { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e4e4e7; }
    .fig figcaption { font-size: 0.75rem; color: #71717a; margin-top: 0.35rem; }
    .missing { font-size: 0.85rem; color: #b91c1c; }
  </style>
</head>
<body>
  <h1>Vista previa — primeras 10 preguntas parseadas</h1>
  <p class="src">Fuente JSON: <code>${esc(INPUT)}</code> · generado: <code>${esc(
    data.generated_at || "",
  )}</code></p>
  ${items.join("\n")}
</body>
</html>`

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true })
  await fs.writeFile(OUTPUT, html, "utf8")
  console.log(`Escrito: ${OUTPUT}`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
