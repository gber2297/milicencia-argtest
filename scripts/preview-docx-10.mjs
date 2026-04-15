/**
 * Vista previa HTML: primeras N preguntas desde tmp/questions-from-docx.json
 * Uso: node scripts/preview-docx-10.mjs
 *   INPUT_JSON=tmp/foo.json LIMIT=10 OUTPUT_HTML=tmp/out.html
 */

import fs from "node:fs/promises"
import path from "node:path"

const INPUT = path.resolve(process.env.INPUT_JSON ?? "tmp/questions-from-docx.json")
const OUTPUT = path.resolve(process.env.OUTPUT_HTML ?? "tmp/preview-docx-10.html")
const LIMIT = Number(process.env.LIMIT ?? 10)

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
  const list = all.slice(0, LIMIT)

  const items = []
  for (let i = 0; i < list.length; i += 1) {
    const q = list[i]
    const imgs = Array.isArray(q.question_images) ? q.question_images : []
    const figs = []
    for (const rel of imgs) {
      const src = rel.replace(/^tmp\//, "./")
      const abs = path.resolve(path.dirname(OUTPUT), src)
      let ok = false
      try {
        await fs.access(abs)
        ok = true
      } catch {
        ok = false
      }
      if (ok)
        figs.push(
          `<figure class="fig"><img src="${esc(src)}" alt="" loading="lazy" /><figcaption>${esc(rel)}</figcaption></figure>`,
        )
      else figs.push(`<p class="missing">Imagen no encontrada: ${esc(rel)}</p>`)
    }

    const optionRows = (Array.isArray(q.options) ? q.options : []).map((o, idx) => {
      const letter = o.source_letter ?? String.fromCharCode(65 + idx)
      const correct = !!o.is_correct
      return `<li class="opt${correct ? " opt-correct" : ""}"><span class="opt-letter">${esc(letter)}.</span> ${esc(o.option_text)}</li>`
    })

    items.push(`<article class="card">
  <header class="card-head">
    <span class="badge">#${i + 1}</span>
    <span class="meta">nº ${esc(q.source_number)} · ${esc(q.difficulty || "?")} · ${q.has_question_image ? "con imagen" : "sin imagen"}</span>
  </header>
  <p class="detection">${esc(q.correct_option_detection)} · correcta: ${q.correct_option_letter != null ? esc(q.correct_option_letter) : "—"}</p>
  <p class="hint">Correcta = <strong>texto</strong> en verde (w:color), no fondo verde.</p>
  <div class="stem">${esc(q.question_text)}</div>
  ${figs.join("\n")}
  <ol class="opts">${optionRows.join("")}</ol>
</article>`)
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vista previa DOCX — ${LIMIT} preguntas</title>
  <style>
    :root { font-family: system-ui, sans-serif; background: #f4f4f5; color: #18181b; }
    body { max-width: 52rem; margin: 0 auto; padding: 1.25rem 1rem 3rem; }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.35rem; }
    .src { font-size: 0.85rem; color: #71717a; margin-bottom: 1rem; }
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
    .detection { font-size: 0.78rem; color: #a16207; background: #fef9c3; padding: 0.35rem 0.5rem; border-radius: 6px; margin: 0 0 0.5rem; }
    .hint { font-size: 0.78rem; color: #3f6212; background: #ecfccb; padding: 0.35rem 0.5rem; border-radius: 6px; margin: 0 0 0.75rem; }
    .stem { white-space: pre-wrap; line-height: 1.45; margin-bottom: 0.75rem; }
    .opts { margin: 0; padding-left: 0; list-style: none; }
    .opt { padding: 0.45rem 0.5rem; border-radius: 6px; margin-bottom: 0.35rem; border: 1px solid #e4e4e7; }
    .opt-correct { border-color: rgb(144, 200, 82); background: rgba(144, 200, 82, 0.15); }
    .opt-letter { font-weight: 600; margin-right: 0.25rem; }
    .fig { margin: 0.5rem 0 0; }
    .fig img { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e4e4e7; }
    .fig figcaption { font-size: 0.75rem; color: #71717a; margin-top: 0.35rem; }
    .missing { font-size: 0.85rem; color: #b91c1c; }
  </style>
</head>
<body>
  <h1>Vista previa — preguntas desde DOCX</h1>
  <p class="src">JSON: <code>${esc(INPUT)}</code> · generado: <code>${esc(data.generated_at || "")}</code></p>
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
