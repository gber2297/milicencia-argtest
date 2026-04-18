import { NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  theme: z.string().optional(),
  channel: z.enum(["tiktok", "reels", "shorts"]).optional(),
  recentContext: z.string().optional(),
})

const IDEAS = [
  "Prioridad en rotonda: ¿quién pasa primero? (comentá A/B/C)",
  "PARE vs CEDA: el error que hace desaprobar",
  "Alcohol al volante: qué cae seguro en el examen",
  "Límite en ciudad sin carteles: mini quiz 10s",
  "Señal de peligro: qué significa en la práctica",
  "No es suerte: 5 minutos de práctica por día",
  "Si reprobaste: esto no te define (acción concreta)",
  "Simulacro en la app: practicá como en el examen real",
]

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const seed = `${parsed.data.theme ?? ""}-${parsed.data.channel ?? ""}-${Date.now()}`
  const idx = Math.abs(hash(seed)) % IDEAS.length
  const idea = IDEAS[idx]
  const cta = "Descargá la app y practicá hoy"
  return NextResponse.json({ idea, cta })
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}
