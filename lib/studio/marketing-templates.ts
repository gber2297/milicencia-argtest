import { framesForViralRole } from "@/lib/studio/timing"
import { defaultBranding, defaultCta, defaultFinalCard } from "@/lib/studio/runtime"
import type { StudioScene, VideoRuntime } from "@/types/studio"

const FPS = 30
const CHANNEL = "tiktok" as const
const VOICE_SPEED = 1

export interface MarketingTemplateDefinition {
  id: string
  name: string
  description: string
  /** Exactamente 5 escenas; la IA solo sobrescribe text, voiceText, imageSearchQuery */
  baseScenes: StudioScene[]
}

function mk(
  id: string,
  type: StudioScene["type"],
  text: string,
  extra: Partial<StudioScene> = {},
): StudioScene {
  const voice = extra.voiceText ?? text
  return {
    id,
    type,
    durationInFrames: framesForViralRole(type, voice, VOICE_SPEED, FPS),
    backgroundType: "image",
    backgroundUrl: "",
    text,
    voiceText: voice,
    imageSearchQuery: extra.imageSearchQuery ?? "driving school study app",
    ...extra,
  }
}

/** Plantilla “5 golpes”: hook → dolor → pausa → valor → reveal; luego CTA + cierre en código. */
function buildFiveBeatTemplate(): StudioScene[] {
  const opts = [
    { id: "a", label: "A) Sigo sin practicar" },
    { id: "b", label: "B) Uso simulacros reales" },
    { id: "c", label: "C) Solo leo el manual" },
  ]
  return [
    mk("m1_hook", "hook", "Pará el scroll: esto te ahorra un mes de cola.", {
      imageSearchQuery: "person frustrated traffic exam vertical",
    }),
    mk("m2_question", "question", "¿Cuántas veces te sentís listo y fallás por un detalle?", {
      imageSearchQuery: "student studying phone test anxiety vertical",
    }),
    mk("m3_pause", "pause", "Pensalo antes de seguir…", {
      highlightText: "···",
      imageSearchQuery: "thinking pause study vertical",
    }),
    mk("m4_expl", "explanation", "La app te da el mismo formato que el examen: cronómetro, banco, feedback.", {
      imageSearchQuery: "mobile app mockup study vertical",
    }),
    mk("m5_reveal", "reveal", "La clave es practicar como en el real.", {
      options: opts,
      correctOptionId: "b",
      voiceText: "La B: simulacros reales. Así ganás confianza.",
      imageSearchQuery: "happy student passed exam vertical",
    }),
  ]
}

export const MARKETING_TEMPLATE_DEFINITIONS: MarketingTemplateDefinition[] = [
  {
    id: "five_beat",
    name: "5 golpes + CTA",
    description: "Hook, dolor, pausa, propuesta de valor, reveal con opciones; CTA y cierre fijos.",
    baseScenes: buildFiveBeatTemplate(),
  },
]

export function getMarketingTemplateDefinition(id: string): MarketingTemplateDefinition | undefined {
  return MARKETING_TEMPLATE_DEFINITIONS.find((t) => t.id === id)
}

/** Runtime de marketing de ejemplo (tests). */
export function buildPlaceholderMarketingRuntime(templateId: string): VideoRuntime {
  const def = getMarketingTemplateDefinition(templateId) ?? MARKETING_TEMPLATE_DEFINITIONS[0]!
  const branding = defaultBranding()
  const cta = defaultCta("Descargá MiLicencia — link en bio")
  const finalCard = defaultFinalCard({
    title: "Tu teórico, sin vueltas",
    subtitle: "Simulacros ilimitados · Argentina",
    backgroundUrl: "",
  })

  const scenes: StudioScene[] = [
    ...def.baseScenes.map((s) => ({ ...s })),
    {
      id: "m6_cta",
      type: "cta",
      durationInFrames: framesForViralRole("cta", cta.text, VOICE_SPEED, FPS),
      backgroundType: "gradient",
      text: cta.text,
      voiceText: cta.text,
    },
    {
      id: "m7_final",
      type: "final_card",
      durationInFrames: framesForViralRole("final_card", `${finalCard.title} ${finalCard.subtitle}`, VOICE_SPEED, FPS),
      backgroundType: "image",
      backgroundUrl: finalCard.backgroundUrl,
      text: finalCard.title,
      voiceText: finalCard.subtitle,
    },
  ]

  return {
    videoType: "marketing",
    channel: CHANNEL,
    theme: "marketing_mi_licencia",
    fps: FPS,
    width: 1080,
    height: 1920,
    voiceSpeed: VOICE_SPEED,
    music: { enabled: false, url: "" },
    branding,
    cta,
    finalCard,
    scenes,
    meta: { brief: "placeholder marketing", generationMode: "full_ai", createdAt: new Date().toISOString() },
  }
}
