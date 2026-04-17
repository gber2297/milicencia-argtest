import type { VideoType } from "@/types/studio"

export interface StudioTemplateDefinition {
  id: string
  videoType: VideoType
  name: string
  description: string
  sceneCount: number
  idealSeconds: [number, number]
}

export const STUDIO_TEMPLATE_DEFINITIONS: StudioTemplateDefinition[] = [
  {
    id: "quiz_v1",
    videoType: "quiz",
    name: "Quiz viral 8 escenas",
    description: "Hook → pregunta → opciones → pausa → reveal → explicación → CTA → final",
    sceneCount: 8,
    idealSeconds: [18, 35],
  },
  {
    id: "error_v1",
    videoType: "error",
    name: "Error común",
    description: "Hook → error típico → explicación → consecuencia → CTA → final",
    sceneCount: 6,
    idealSeconds: [15, 30],
  },
  {
    id: "motivacion_v1",
    videoType: "motivacion",
    name: "Motivación estudio",
    description: "Hook → emoción → contención → acción → CTA → final",
    sceneCount: 6,
    idealSeconds: [15, 28],
  },
  {
    id: "datos_v1",
    videoType: "datos_curiosos",
    name: "Dato curioso",
    description: "full_ia: HOOK → retención → contenido → CTA + stock + TTS 4 segmentos",
    sceneCount: 5,
    idealSeconds: [15, 28],
  },
  {
    id: "story_v1",
    videoType: "storytelling",
    name: "Storytelling",
    description: "full_ia: arco narrativo corto + CTA + imágenes + TTS",
    sceneCount: 5,
    idealSeconds: [16, 32],
  },
  {
    id: "app_v1",
    videoType: "app",
    name: "App + screenshot",
    description: "Hook → beneficio → screenshot → CTA → final",
    sceneCount: 5,
    idealSeconds: [15, 30],
  },
]
