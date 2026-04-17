import { z } from "zod"

import type { SceneType } from "@/types/studio"
import type { StudioChannel } from "@/types/studio"

const scenePartSchema = z.object({
  text: z.string(),
  voiceText: z.string(),
  imageSearchQuery: z.string(),
})

const scriptSchema = z.object({
  scenes: z.array(scenePartSchema).length(5),
  cta: z.string(),
  ctaVoiceText: z.string(),
})

export type MarketingScriptPayload = z.infer<typeof scriptSchema>

const MARKETING_SCRIPT_SYSTEM = `Sos copywriter para videos verticales (TikTok / Reels / Shorts) de la app "Mi Licencia" (Argentina): examen teórico de manejo, simulacros y práctica.
Reglas:
- Textos en pantalla en minúsculas salvo nombres propios ("Mi Licencia") cuando suene natural.
- Voz natural, rioplatense neutro, sin exclamaciones exageradas.
- imageSearchQuery: siempre en INGLÉS, corto (3-8 palabras), para búsqueda de stock vertical: estudio, manejo, examen, app móvil, tránsito, etc. Sin comillas.
- Devolvé SOLO JSON válido, sin markdown, sin texto fuera del JSON.

Estructura exacta:
{
  "scenes": [
    { "text": "...", "voiceText": "...", "imageSearchQuery": "..." },
    ... exactamente 5 objetos en el mismo orden que las escenas del template
  ],
  "cta": "texto del botón CTA en pantalla",
  "ctaVoiceText": "texto para locución del CTA (puede ser más largo)"
}`

export async function suggestMarketingScript(input: {
  templateId: string
  brief: string
  channel: StudioChannel
  sceneTypes: SceneType[]
}): Promise<MarketingScriptPayload> {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) throw new Error("Falta OPENAI_API_KEY en el entorno")

  const user = `Template: ${input.templateId}
Canal: ${input.channel}
Tipos de las 5 escenas (en orden): ${input.sceneTypes.join(", ")}
Brief del cliente / idea:
${input.brief.trim() || "Promo general: practicar el teórico con simulacros reales."}

Generá el JSON según el esquema del system prompt.`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MARKETING_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.85,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: MARKETING_SCRIPT_SYSTEM },
        { role: "user", content: user },
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

  const check = scriptSchema.safeParse(parsed)
  if (!check.success) {
    throw new Error(`JSON de guion inválido: ${check.error.message}`)
  }
  return check.data
}
