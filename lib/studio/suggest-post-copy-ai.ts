import { z } from "zod"

import type { StudioChannel, VideoRuntime } from "@/types/studio"

const responseSchema = z.object({
  caption: z.string().min(1),
  hashtags: z.array(z.string()).optional(),
})

function runtimeSummary(runtime: VideoRuntime): string {
  const brief = (runtime.meta?.brief ?? "").trim()
  const cta = (runtime.cta?.text ?? "").trim()
  const scenes = runtime.scenes
    .map((s, i) => {
      const t = (s.voiceText ?? s.text ?? "").trim()
      return t ? `${i + 1}. ${t}` : null
    })
    .filter(Boolean)
    .join("\n")
  return [
    brief && `Brief: ${brief}`,
    cta && `CTA: ${cta}`,
    scenes && `Escenas / guion:\n${scenes}`,
  ]
    .filter(Boolean)
    .join("\n\n")
}

const SYSTEM_TIKTOK = `Sos copywriter para TikTok en Argentina: app "Mi Licencia" (examen teórico de manejo, simulacros).
Generá un caption optimizado para TikTok en español rioplatense:
- Gancho en las primeras palabras (retención en FYP).
- Cuerpo breve (2-5 líneas cortas), tono claro, sin clickbait falso.
- Incluí llamado a comentar (pregunta o A/B/C) y mención natural a practicar en la app.
- Al final, línea de hashtags: 5-8 hashtags en español (#examenVial #miLicencia etc.), mezcla nicho + alcance.
- Sin markdown. Sin comillas envolviendo todo el texto.
Devolvé SOLO JSON válido: {"caption":"texto completo del post incluyendo saltos de línea y hashtags al final","hashtags":["#uno","#dos"]}`

const SYSTEM_GENERIC = `Sos copywriter para video vertical (Reels / Shorts / TikTok) de la app "Mi Licencia" (Argentina, examen teórico).
Caption breve en español, tono natural, CTA a practicar en la app, hashtags al final (5-8).
Devolvé SOLO JSON: {"caption":"...","hashtags":["..."]}`

export async function suggestPostCopyWithOpenAI(input: {
  channel: StudioChannel
  runtime: VideoRuntime | null
  summary: string | undefined
}): Promise<{ copy: string; hashtags: string[] }> {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) throw new Error("Falta OPENAI_API_KEY en el entorno")

  const fromRuntime = input.runtime ? runtimeSummary(input.runtime) : ""
  const userBlock = [input.summary?.trim(), fromRuntime].filter(Boolean).join("\n\n---\n\n")
  const user =
    userBlock.trim() ||
    "Video educativo sobre reglas de tránsito y examen teórico. Promocioná practicar con Mi Licencia."

  const system = input.channel === "tiktok" ? SYSTEM_TIKTOK : SYSTEM_GENERIC

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MARKETING_MODEL?.trim() || process.env.OPENAI_NARRATIVE_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.75,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Canal: ${input.channel}\n\n${user}` },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 400)}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const raw = data.choices?.[0]?.message?.content?.trim()
  if (!raw) throw new Error("Respuesta OpenAI vacía")

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("OpenAI no devolvió JSON válido")
  }

  const check = responseSchema.safeParse(parsed)
  if (!check.success) throw new Error(`JSON de copy inválido: ${check.error.message}`)

  const hashtags = check.data.hashtags?.length ? check.data.hashtags : []
  return { copy: check.data.caption.trim(), hashtags }
}

export function fallbackPostCopy(input: {
  channel: StudioChannel
  summary?: string
}): { copy: string; hashtags: string[] } {
  const line =
    input.channel === "tiktok"
      ? "Comentá tu respuesta 👇 y practicá el teórico en la APP (Argentina)."
      : input.channel === "reels"
        ? "Guardá esto para antes del examen. Practicá en la APP cuando quieras."
        : "Suscribite para más tips y practicá en la APP con simulacros."

  const copy = input.summary ? `${input.summary}\n\n${line}` : line
  const hashtags = ["#miLicencia", "#examenVial", "#Argentina"]
  return { copy, hashtags }
}
