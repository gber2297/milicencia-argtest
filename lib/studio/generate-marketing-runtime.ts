import { mkdir, writeFile } from "fs/promises"

import { framesForViralRole } from "@/lib/studio/timing"
import { MARKETING_RUNTIME_JSON } from "@/lib/studio/marketing-paths"
import {
  buildPlaceholderMarketingRuntime,
  getMarketingTemplateDefinition,
} from "@/lib/studio/marketing-templates"
import { normalizeSceneDurations } from "@/lib/studio/runtime"
import { resolveSceneImageUrl } from "@/lib/studio/resolve-scene-image"
import { suggestMarketingScript, type MarketingScriptPayload } from "@/lib/studio/suggest-marketing-script"
import type { StudioChannel, StudioScene, VideoRuntime } from "@/types/studio"

const FPS = 30
const VOICE_SPEED = 1

/** Sufijo para búsqueda de stock vertical (inglés + contexto) */
const IMAGE_QUERY_SUFFIX = "vertical portrait stock photo"

/** Imagen de lifestyle para el cierre (final_card.backgroundUrl) */
const FINAL_CARD_STOCK_QUERY = "young person smartphone studying vertical lifestyle portrait"

function sceneRoleForFrames(type: StudioScene["type"]): Parameters<typeof framesForViralRole>[0] {
  if (type === "screenshot_focus") return "screenshot_focus"
  return type
}

export function mergeScriptIntoMarketingRuntime(
  templateId: string,
  script: MarketingScriptPayload,
): VideoRuntime {
  const def = getMarketingTemplateDefinition(templateId)
  if (!def) throw new Error(`Template marketing desconocido: ${templateId}`)

  const base = buildPlaceholderMarketingRuntime(templateId)

  const mergedFirst5: StudioScene[] = def.baseScenes.map((scene, i) => {
    const part = script.scenes[i]
    if (!part) return { ...scene }
    const voiceText = part.voiceText.trim() || part.text
    const durationInFrames = framesForViralRole(
      sceneRoleForFrames(scene.type),
      voiceText,
      VOICE_SPEED,
      FPS,
    )
    return {
      ...scene,
      text: part.text,
      voiceText,
      imageSearchQuery: part.imageSearchQuery.trim() || scene.imageSearchQuery,
      durationInFrames,
    }
  })

  const ctaText = script.cta.trim() || base.cta.text
  const ctaVoiceText = script.ctaVoiceText.trim() || ctaText

  const ctaScene: StudioScene = {
    id: "m6_cta",
    type: "cta",
    durationInFrames: framesForViralRole("cta", ctaVoiceText, VOICE_SPEED, FPS),
    backgroundType: "gradient",
    text: ctaText,
    voiceText: ctaVoiceText,
  }

  const finalFromBase = base.scenes.find((s) => s.type === "final_card")!

  return normalizeSceneDurations({
    ...base,
    cta: {
      ...base.cta,
      text: ctaText,
      ctaVoiceText,
    },
    scenes: [...mergedFirst5, ctaScene, { ...finalFromBase }],
    meta: {
      ...base.meta,
      generationMode: "full_ai",
    },
  })
}

/** Resuelve URLs de fondo; limpia imageSearchQuery tras éxito. */
export async function resolveMarketingStockImages(runtime: VideoRuntime): Promise<VideoRuntime> {
  const scenes: StudioScene[] = await Promise.all(
    runtime.scenes.map(async (scene): Promise<StudioScene> => {
      const q = scene.imageSearchQuery?.trim()
      if (!q) return scene
      const fullQuery = `${q} ${IMAGE_QUERY_SUFFIX}`
      const { url } = await resolveSceneImageUrl(fullQuery)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip search query after resolve
      const { imageSearchQuery, ...rest } = scene
      void imageSearchQuery
      return {
        ...rest,
        backgroundType: "image" as const,
        backgroundUrl: url,
      }
    }),
  )

  const { url: finalBg } = await resolveSceneImageUrl(FINAL_CARD_STOCK_QUERY)

  return {
    ...runtime,
    scenes: scenes.map((s) =>
      s.type === "final_card"
        ? { ...s, backgroundType: "image" as const, backgroundUrl: finalBg }
        : s,
    ),
    finalCard: {
      ...runtime.finalCard,
      backgroundUrl: finalBg,
    },
  }
}

export async function buildMarketingVideoRuntime(input: {
  templateId: string
  brief: string
  channel: StudioChannel
}): Promise<VideoRuntime> {
  const def = getMarketingTemplateDefinition(input.templateId)
  if (!def) throw new Error(`Template marketing desconocido: ${input.templateId}`)

  const script = await suggestMarketingScript({
    templateId: input.templateId,
    brief: input.brief,
    channel: input.channel,
    sceneTypes: def.baseScenes.map((s) => s.type),
  })

  let runtime = mergeScriptIntoMarketingRuntime(input.templateId, script)
  runtime = {
    ...runtime,
    channel: input.channel,
    meta: {
      ...runtime.meta,
      brief: input.brief,
      generationMode: "full_ai",
      createdAt: new Date().toISOString(),
    },
  }
  runtime = await resolveMarketingStockImages(runtime)
  return normalizeSceneDurations(runtime)
}

export async function saveMarketingRuntime(runtime: VideoRuntime): Promise<void> {
  await mkdir(MARKETING_RUNTIME_JSON.replace(/[/\\][^/\\]+$/, ""), { recursive: true })
  await writeFile(MARKETING_RUNTIME_JSON, JSON.stringify(runtime, null, 2), "utf8")
}
