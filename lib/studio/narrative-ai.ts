import { z } from "zod"

import { framesForViralRole } from "@/lib/studio/timing"
import { defaultBranding, defaultCta, defaultFinalCard, normalizeSceneDurations } from "@/lib/studio/runtime"
import { resolveSceneImageUrl } from "@/lib/studio/resolve-scene-image"
import type { StudioChannel, StudioScene, VideoRuntime, VideoType } from "@/types/studio"

const FPS = 30
const VOICE_SPEED = 1
const IMAGE_SUFFIX = "vertical portrait stock photo"

/** Tipos que usan el guion IA de 4 bloques + final (sin quiz/app/marketing). */
export const NARRATIVE_AI_VIDEO_TYPES = ["error", "motivacion", "datos_curiosos", "storytelling"] as const
export type NarrativeAiVideoType = (typeof NARRATIVE_AI_VIDEO_TYPES)[number]

export function isNarrativeAiVideoType(t: VideoType): t is NarrativeAiVideoType {
  return (NARRATIVE_AI_VIDEO_TYPES as readonly string[]).includes(t)
}

export function isNarrativeFourRuntime(runtime: VideoRuntime): boolean {
  return runtime.meta?.audioLayout === "narrative_four"
}

const blockSchema = z.object({
  text: z.string(),
  voiceText: z.string(),
  imageSearchQuery: z.string(),
})

const narrativeScriptSchema = z.object({
  hook: blockSchema,
  retention: blockSchema,
  content: blockSchema,
  cta: blockSchema,
  finalCard: z.object({
    title: z.string(),
    subtitle: z.string(),
    imageSearchQuery: z.string().optional(),
  }),
})

export type NarrativeScriptPayload = z.infer<typeof narrativeScriptSchema>

function systemPromptForType(videoType: NarrativeAiVideoType): string {
  const base = `Sos guionista para videos verticales (TikTok / Reels / Shorts) de "Mi Licencia" (Argentina, examen teórico de manejo).
Estructura obligatoria de 4 bloques + cierre:
1) HOOK — atrapa en 1 frase
2) RETENCIÓN — tensión, curiosidad o emoción (sin spoilear todo)
3) CONTENIDO — el dato útil, la corrección o la historia
4) CTA — llamado a practicar en la app

Reglas:
- text: copy en pantalla, preferentemente minúsculas salvo nombres propios
- voiceText: natural para locución (es-AR neutro)
- imageSearchQuery: siempre en INGLÉS, corto, para stock vertical (tráfico, estudio, examen, app, emoción, etc.)

Devolvé SOLO JSON válido con esta forma exacta:
{
  "hook": { "text", "voiceText", "imageSearchQuery" },
  "retention": { ... },
  "content": { ... },
  "cta": { ... },
  "finalCard": { "title", "subtitle", "imageSearchQuery" opcional }
}`

  const byType: Record<NarrativeAiVideoType, string> = {
    error: `${base}\nEnfoque: desmentir mitos, errores típicos del examen o señales mal interpretadas.`,
    motivacion: `${base}\nEnfoque: emoción, ansiedad, confianza, hábitos de estudio; empático.`,
    datos_curiosos: `${base}\nEnfoque: dato curioso sobre normas, historia del tránsito o estadísticas que sorprendan.`,
    storytelling: `${base}\nEnfoque: mini historia con gancho, conflicto y resolución ligada a estudiar/practicar.`,
  }
  return byType[videoType]
}

export async function suggestNarrativeScript(input: {
  videoType: NarrativeAiVideoType
  brief: string
  channel: StudioChannel
}): Promise<NarrativeScriptPayload> {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) throw new Error("Falta OPENAI_API_KEY en el entorno")

  const user = `Tipo de video: ${input.videoType}
Canal: ${input.channel}
Brief / idea:
${input.brief.trim() || "contenido general para aprobar el teórico"}`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_NARRATIVE_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.85,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPromptForType(input.videoType) },
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

  const check = narrativeScriptSchema.safeParse(parsed)
  if (!check.success) {
    throw new Error(`JSON de guion inválido: ${check.error.message}`)
  }
  return check.data
}

function sceneRole(
  kind: "hook" | "pause" | "explanation" | "cta" | "final_card",
): Parameters<typeof framesForViralRole>[0] {
  return kind
}

export async function buildNarrativeAiRuntime(input: {
  videoType: NarrativeAiVideoType
  brief: string
  channel: StudioChannel
}): Promise<VideoRuntime> {
  const script = await suggestNarrativeScript(input)
  const branding = defaultBranding()
  const cta = defaultCta(script.cta.text.trim())
  cta.ctaVoiceText = script.cta.voiceText.trim()

  const hook = script.hook
  const ret = script.retention
  const cont = script.content
  const ctaB = script.cta
  const fc = script.finalCard

  const scenes: StudioScene[] = [
    {
      id: "nar_hook",
      type: "hook",
      durationInFrames: framesForViralRole(sceneRole("hook"), hook.voiceText || hook.text, VOICE_SPEED, FPS),
      backgroundType: "image",
      backgroundUrl: "",
      text: hook.text,
      voiceText: hook.voiceText || hook.text,
      imageSearchQuery: hook.imageSearchQuery,
    },
    {
      id: "nar_retention",
      type: "pause",
      durationInFrames: framesForViralRole(sceneRole("pause"), ret.voiceText || ret.text, VOICE_SPEED, FPS),
      backgroundType: "image",
      backgroundUrl: "",
      text: ret.text,
      voiceText: ret.voiceText || ret.text,
      highlightText: "···",
      imageSearchQuery: ret.imageSearchQuery,
    },
    {
      id: "nar_content",
      type: "explanation",
      durationInFrames: framesForViralRole(
        sceneRole("explanation"),
        cont.voiceText || cont.text,
        VOICE_SPEED,
        FPS,
      ),
      backgroundType: "image",
      backgroundUrl: "",
      text: cont.text,
      voiceText: cont.voiceText || cont.text,
      imageSearchQuery: cont.imageSearchQuery,
    },
    {
      id: "nar_cta",
      type: "cta",
      durationInFrames: framesForViralRole(sceneRole("cta"), ctaB.voiceText || ctaB.text, VOICE_SPEED, FPS),
      backgroundType: "image",
      backgroundUrl: "",
      text: ctaB.text,
      voiceText: ctaB.voiceText || ctaB.text,
      imageSearchQuery: ctaB.imageSearchQuery,
    },
    {
      id: "nar_final",
      type: "final_card",
      durationInFrames: framesForViralRole(
        sceneRole("final_card"),
        `${fc.title} ${fc.subtitle}`,
        VOICE_SPEED,
        FPS,
      ),
      backgroundType: "image",
      backgroundUrl: "",
      text: fc.title,
      voiceText: fc.subtitle,
      imageSearchQuery:
        fc.imageSearchQuery?.trim() || "student relieved passed exam smartphone vertical lifestyle",
    },
  ]

  const finalCard = defaultFinalCard({
    title: fc.title.trim(),
    subtitle: fc.subtitle.trim(),
    backgroundUrl: "",
  })

  let runtime: VideoRuntime = {
    videoType: input.videoType as VideoType,
    channel: input.channel,
    theme: `narrative_${input.videoType}`,
    fps: FPS,
    width: 1080,
    height: 1920,
    voiceSpeed: VOICE_SPEED,
    music: { enabled: false, url: "" },
    branding,
    cta,
    finalCard,
    scenes,
    meta: {
      brief: input.brief,
      generationMode: "full_ai",
      createdAt: new Date().toISOString(),
      audioLayout: "narrative_four",
      voiceSegmentCount: 4,
    },
  }

  runtime = await resolveNarrativeStockImages(runtime)
  return normalizeSceneDurations(runtime)
}

export async function resolveNarrativeStockImages(runtime: VideoRuntime): Promise<VideoRuntime> {
  const scenes: StudioScene[] = await Promise.all(
    runtime.scenes.map(async (scene): Promise<StudioScene> => {
      const q = scene.imageSearchQuery?.trim()
      if (!q) {
        if (scene.type === "final_card") {
          return {
            ...scene,
            backgroundType: "gradient",
            backgroundUrl: runtime.finalCard.backgroundUrl,
          }
        }
        return scene
      }
      const fullQuery = `${q} ${IMAGE_SUFFIX}`
      const { url } = await resolveSceneImageUrl(fullQuery)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip after resolve
      const { imageSearchQuery, ...rest } = scene
      void imageSearchQuery
      return {
        ...rest,
        backgroundType: "image" as const,
        backgroundUrl: url,
      }
    }),
  )

  const finalScene = scenes.find((s) => s.type === "final_card")
  const finalBg =
    finalScene?.backgroundUrl?.trim() ||
    runtime.finalCard.backgroundUrl ||
    (await resolveSceneImageUrl("driving exam success student relieved vertical portrait")).url

  return {
    ...runtime,
    scenes: scenes.map((s) =>
      s.type === "final_card" ? { ...s, backgroundType: "image" as const, backgroundUrl: finalBg } : s,
    ),
    finalCard: {
      ...runtime.finalCard,
      backgroundUrl: finalBg,
    },
  }
}
