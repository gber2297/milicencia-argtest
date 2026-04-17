import type { Question, QuestionOption } from "@/types/domain"
import type {
  GenerationMode,
  SceneOption,
  StudioChannel,
  VideoRuntime,
  VideoType,
} from "@/types/studio"
import { buildPlaceholderMarketingRuntime } from "@/lib/studio/marketing-templates"
import { defaultBranding, defaultCta, defaultFinalCard } from "@/lib/studio/runtime"
import { framesForViralRole } from "@/lib/studio/timing"

const THEME = "examen_conducir_argentina"
const FPS = 30
const W = 1080
const H = 1920

function baseRuntime(
  videoType: VideoType,
  channel: StudioChannel,
  voiceSpeed: number,
  generationMode: GenerationMode,
  brief: string,
): VideoRuntime {
  return {
    videoType,
    channel,
    theme: THEME,
    fps: FPS,
    width: W,
    height: H,
    voiceSpeed,
    music: { enabled: false, url: "" },
    branding: defaultBranding(),
    cta: defaultCta(),
    finalCard: defaultFinalCard(),
    scenes: [],
    meta: { brief, generationMode, createdAt: new Date().toISOString() },
  }
}

/** Hooks más fuertes para retención inicial (máx. ~6 palabras cuando se usan solos). */
const VIRAL_HOOKS_QUIZ = [
  "Pará el scroll: esto cae",
  "El 80% la pifia acá",
  "¿Aprobás? 3 segundos",
  "Esto confunde a todos",
  "Prioridad: la mayoría falla",
  "Pará: esto es trampa",
]

const AI_PAUSES = [
  "Pensalo bien…",
  "La mayoría elige mal",
  "Congelá: 3… 2…",
  "¿Ya tenés la respuesta?",
]

function pick<T>(arr: T[], seed: string): T {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return arr[h % arr.length]
}

export function generateQuizRuntimeFromBrief(
  brief: string,
  channel: StudioChannel,
  generationMode: GenerationMode,
  voiceSpeed: number,
  ctaText?: string,
): VideoRuntime {
  const clean = brief.trim() || "En rotonda, ¿quién tiene prioridad al entrar?"
  const r = baseRuntime("quiz", channel, voiceSpeed, generationMode, clean)
  r.cta = defaultCta(ctaText ?? "Probá gratis — link en bio")
  r.finalCard = defaultFinalCard({
    title: "Pasá el teórico más rápido",
    subtitle: "Simulacros reales · gratis hoy",
  })
  r.meta = { ...r.meta, questionSource: "template" }

  const hook =
    generationMode === "full_ai"
      ? pick(VIRAL_HOOKS_QUIZ, clean)
      : pick(VIRAL_HOOKS_QUIZ, clean + "p")
  const question =
    clean.includes("?") && clean.length > 12
      ? clean
      : "En rotonda, ¿quién tiene prioridad: quien entra o quien ya circula adentro?"
  const pause = generationMode === "full_ai" ? pick(AI_PAUSES, clean + "z") : pick(AI_PAUSES, clean)

  const options = [
    { id: "a", label: "A) Quien entra" },
    { id: "b", label: "B) Quien ya circula" },
    { id: "c", label: "C) El más rápido" },
  ]

  const expl =
    "Si hay Ceda al entrar, cedés a quien ya circula en la rotonda. Eso es lo que busca el examen."

  r.scenes = [
    {
      id: "s1_hook",
      type: "hook",
      durationInFrames: framesForViralRole("hook", hook, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: hook,
      voiceText: hook,
    },
    {
      id: "s2_question",
      type: "question",
      durationInFrames: framesForViralRole("question", question, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: question,
      voiceText: question,
    },
    {
      id: "s3_options",
      type: "options",
      durationInFrames: framesForViralRole("options", "A, B o C en pantalla.", voiceSpeed, FPS),
      backgroundType: "gradient",
      text: "",
      voiceText: "Mirá las opciones.",
      options,
    },
    {
      id: "s4_pause",
      type: "pause",
      durationInFrames: framesForViralRole("pause", pause, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: pause,
      voiceText: pause,
      highlightText: "···",
    },
    {
      id: "s5_reveal",
      type: "reveal",
      durationInFrames: framesForViralRole("reveal", "La correcta es la B.", voiceSpeed, FPS),
      backgroundType: "gradient",
      text: "Correcto",
      voiceText: "La B. Quien ya circula.",
      options,
      correctOptionId: "b",
    },
    {
      id: "s6_expl",
      type: "explanation",
      durationInFrames: framesForViralRole("explanation", expl, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: expl,
      voiceText: expl,
    },
    {
      id: "s7_cta",
      type: "cta",
      durationInFrames: framesForViralRole("cta", r.cta.text, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: r.cta.text,
      voiceText: r.cta.text,
    },
    {
      id: "s8_final",
      type: "final_card",
      durationInFrames: framesForViralRole(
        "final_card",
        `${r.finalCard.title}. ${r.finalCard.subtitle}`,
        voiceSpeed,
        FPS,
      ),
      backgroundType: "gradient",
      text: r.finalCard.title,
      voiceText: r.finalCard.subtitle,
    },
  ]
  return r
}

const STUDIO_OPTION_IDS = ["a", "b", "c", "d", "e", "f"] as const
const MAX_STUDIO_OPTIONS = 6

/** Mapea opciones de BD a ids fijos a–f para reveal/options del Studio. */
export function mapDbOptionsToStudioOptions(
  dbOpts: QuestionOption[],
): {
  options: SceneOption[]
  correctOptionId: string
  correctLetter: string
  correctOptionText: string
} | null {
  const sorted = [...dbOpts].sort((a, b) => a.id.localeCompare(b.id))
  const slice = sorted.slice(0, MAX_STUDIO_OPTIONS)
  if (slice.length < 2) return null
  const correct = slice.find((o) => o.is_correct)
  if (!correct) return null
  const options: SceneOption[] = slice.map((o, i) => ({
    id: STUDIO_OPTION_IDS[i]!,
    label: `${String.fromCharCode(65 + i)}) ${o.option_text}`,
  }))
  const idx = slice.indexOf(correct)
  return {
    options,
    correctOptionId: STUDIO_OPTION_IDS[idx]!,
    correctLetter: String.fromCharCode(65 + idx),
    correctOptionText: correct.option_text,
  }
}

/** Quiz vertical usando una fila real de `questions` + `question_options`. */
export function generateQuizRuntimeFromDbQuestion(
  question: Question,
  brief: string,
  channel: StudioChannel,
  generationMode: GenerationMode,
  voiceSpeed: number,
  ctaText?: string,
): VideoRuntime | null {
  const mapped = mapDbOptionsToStudioOptions(question.question_options ?? [])
  if (!mapped) return null

  const clean = brief.trim() || question.question_text.slice(0, 80)
  const r = baseRuntime("quiz", channel, voiceSpeed, generationMode, clean)
  r.cta = defaultCta(ctaText ?? "Probá gratis — link en bio")
  r.finalCard = defaultFinalCard({
    title: "Pasá el teórico más rápido",
    subtitle: "Simulacros reales · gratis hoy",
  })
  r.meta = {
    ...r.meta,
    questionId: question.id,
    questionSource: "database",
  }

  const hook =
    generationMode === "full_ai"
      ? pick(VIRAL_HOOKS_QUIZ, question.id + clean)
      : pick(VIRAL_HOOKS_QUIZ, clean + "p" + question.id)
  const questionText = question.question_text.trim()
  const pause = generationMode === "full_ai" ? pick(AI_PAUSES, question.id + "z") : pick(AI_PAUSES, question.id)
  const { options, correctOptionId, correctLetter, correctOptionText } = mapped

  const revealVoice = `La ${correctLetter}. ${correctOptionText}`.trim()
  const expl =
    question.explanation?.trim() ||
    "Repasá el temario en la app: simulacros ilimitados y feedback al instante."

  r.scenes = [
    {
      id: "s1_hook",
      type: "hook",
      durationInFrames: framesForViralRole("hook", hook, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: hook,
      voiceText: hook,
    },
    {
      id: "s2_question",
      type: "question",
      durationInFrames: framesForViralRole("question", questionText, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: questionText,
      voiceText: questionText,
    },
    {
      id: "s3_options",
      type: "options",
      durationInFrames: framesForViralRole(
        "options",
        "Opciones en pantalla.",
        voiceSpeed,
        FPS,
      ),
      backgroundType: "gradient",
      text: "",
      voiceText: "Mirá las opciones.",
      options,
    },
    {
      id: "s4_pause",
      type: "pause",
      durationInFrames: framesForViralRole("pause", pause, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: pause,
      voiceText: pause,
      highlightText: "···",
    },
    {
      id: "s5_reveal",
      type: "reveal",
      durationInFrames: framesForViralRole("reveal", revealVoice, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: "Correcto",
      voiceText: revealVoice,
      options,
      correctOptionId,
    },
    {
      id: "s6_expl",
      type: "explanation",
      durationInFrames: framesForViralRole("explanation", expl, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: expl,
      voiceText: expl,
    },
    {
      id: "s7_cta",
      type: "cta",
      durationInFrames: framesForViralRole("cta", r.cta.text, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: r.cta.text,
      voiceText: r.cta.text,
    },
    {
      id: "s8_final",
      type: "final_card",
      durationInFrames: framesForViralRole(
        "final_card",
        `${r.finalCard.title}. ${r.finalCard.subtitle}`,
        voiceSpeed,
        FPS,
      ),
      backgroundType: "gradient",
      text: r.finalCard.title,
      voiceText: r.finalCard.subtitle,
    },
  ]
  return r
}

export function generateErrorRuntimeFromBrief(
  brief: string,
  channel: StudioChannel,
  generationMode: GenerationMode,
  voiceSpeed: number,
  ctaText?: string,
): VideoRuntime {
  const clean = brief.trim() || "PARE es lo mismo que CEDA"
  const r = baseRuntime("error", channel, voiceSpeed, generationMode, clean)
  r.cta = defaultCta(ctaText ?? "Evitá la trampa: practicá en la APP")
  r.finalCard = defaultFinalCard({
    title: "No pierdas puntos boludos",
    subtitle: "Practicá señales en la app · gratis",
  })

  const hook = "Esto te hace desaprobar"
  const mistake =
    generationMode === "full_ai"
      ? `Muchos creen: “${clean.slice(0, 52)}”. No siempre.`
      : `Error típico: ${clean}`
  const expl =
    "PARE: detención donde corresponde. CEDA: cedé el paso; no siempre frenás completo igual que en PARE."
  const cons = "En el examen, confundir señales resta puntos y puede anular la maniobra."

  r.scenes = [
    {
      id: "e1_hook",
      type: "hook",
      durationInFrames: framesForViralRole("hook", hook, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: hook,
      voiceText: hook,
    },
    {
      id: "e2_mistake",
      type: "question",
      durationInFrames: framesForViralRole("question", mistake, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: mistake,
      voiceText: mistake,
    },
    {
      id: "e3_expl",
      type: "explanation",
      durationInFrames: framesForViralRole("explanation", expl, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: expl,
      voiceText: expl,
    },
    {
      id: "e4_cons",
      type: "explanation",
      durationInFrames: framesForViralRole("explanation", cons, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: cons,
      voiceText: cons,
    },
    {
      id: "e5_cta",
      type: "cta",
      durationInFrames: framesForViralRole("cta", r.cta.text, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: r.cta.text,
      voiceText: r.cta.text,
    },
    {
      id: "e6_final",
      type: "final_card",
      durationInFrames: framesForViralRole(
        "final_card",
        `${r.finalCard.title}. ${r.finalCard.subtitle}`,
        voiceSpeed,
        FPS,
      ),
      backgroundType: "gradient",
      text: r.finalCard.title,
      voiceText: r.finalCard.subtitle,
    },
  ]
  return r
}

export function generateMotivationRuntimeFromBrief(
  brief: string,
  channel: StudioChannel,
  generationMode: GenerationMode,
  voiceSpeed: number,
  ctaText?: string,
): VideoRuntime {
  const clean = brief.trim() || "Ansiedad el día del examen"
  const r = baseRuntime("motivacion", channel, voiceSpeed, generationMode, clean)
  r.cta = defaultCta(ctaText ?? "5 minutos hoy en la APP · gratis")
  r.finalCard = defaultFinalCard({
    title: "Vos podés",
    subtitle: "Entrená un poco cada día · resultado: aprobado",
  })

  const emo =
    generationMode === "full_ai"
      ? "Aprobar es más fácil de lo que creés si entrenás con foco."
      : "Si te tiembla el cuerpo el día del examen: es normal."
  const calm = "No es suerte: es práctica hasta que sea automático."
  const act = "Hacé un simulacro hoy. Uno solo. Suma."

  r.scenes = [
    {
      id: "m1_hook",
      type: "hook",
      durationInFrames: framesForViralRole("hook", "No es suerte: es práctica", voiceSpeed, FPS),
      backgroundType: "gradient",
      text: "No es suerte: es práctica",
      voiceText: "No es suerte: es práctica",
    },
    {
      id: "m2_emotion",
      type: "question",
      durationInFrames: framesForViralRole("question", emo, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: emo,
      voiceText: emo,
    },
    {
      id: "m3_reassure",
      type: "explanation",
      durationInFrames: framesForViralRole("explanation", calm, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: calm,
      voiceText: calm,
    },
    {
      id: "m4_action",
      type: "pause",
      durationInFrames: framesForViralRole("pause", act, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: act,
      voiceText: act,
    },
    {
      id: "m5_cta",
      type: "cta",
      durationInFrames: framesForViralRole("cta", r.cta.text, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: r.cta.text,
      voiceText: r.cta.text,
    },
    {
      id: "m6_final",
      type: "final_card",
      durationInFrames: framesForViralRole(
        "final_card",
        `${r.finalCard.title}. ${r.finalCard.subtitle}`,
        voiceSpeed,
        FPS,
      ),
      backgroundType: "gradient",
      text: r.finalCard.title,
      voiceText: r.finalCard.subtitle,
    },
  ]
  return r
}

export function generateAppRuntimeFromBrief(
  brief: string,
  channel: StudioChannel,
  generationMode: GenerationMode,
  voiceSpeed: number,
  ctaText?: string,
  screenshotUrl?: string,
): VideoRuntime {
  const clean = brief.trim() || "Simulacros como el examen real"
  const r = baseRuntime("app", channel, voiceSpeed, generationMode, clean)
  r.cta = defaultCta(ctaText ?? "Descargá y practicá gratis")
  r.finalCard = defaultFinalCard({
    title: "Entrená como en el examen",
    subtitle: "Preguntas + feedback · Argentina",
  })
  const benefit =
    generationMode === "full_ai"
      ? "Banco de preguntas y feedback al instante, como en el examen."
      : "Preguntas tipo examen y repasá lo que fallás. Así en la app."
  const shot = screenshotUrl?.trim() || ""
  const overlayQuestion = "¿Cuál es la respuesta correcta?"
  const overlayAnswer = "La que marca el examen en verde (simulacro)"
  const voiceShot = "Así se ve. Leé la pregunta y la marca."

  r.scenes = [
    {
      id: "a1_hook",
      type: "hook",
      durationInFrames: framesForViralRole("hook", "Estudiá como en el examen", voiceSpeed, FPS),
      backgroundType: "gradient",
      text: "Estudiá como en el examen",
      voiceText: "Estudiá como en el examen",
    },
    {
      id: "a2_benefit",
      type: "question",
      durationInFrames: framesForViralRole("question", benefit, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: benefit,
      voiceText: benefit,
    },
    {
      id: "a3_shot",
      type: "screenshot_focus",
      durationInFrames: framesForViralRole("screenshot_focus", voiceShot, voiceSpeed, FPS),
      backgroundType: "image",
      backgroundUrl: shot,
      screenshotUrl: shot,
      overlayQuestion,
      overlayAnswer,
      text: "",
      voiceText: voiceShot,
    },
    {
      id: "a4_cta",
      type: "cta",
      durationInFrames: framesForViralRole("cta", r.cta.text, voiceSpeed, FPS),
      backgroundType: "gradient",
      text: r.cta.text,
      voiceText: r.cta.text,
    },
    {
      id: "a5_final",
      type: "final_card",
      durationInFrames: framesForViralRole(
        "final_card",
        `${r.finalCard.title}. ${r.finalCard.subtitle}`,
        voiceSpeed,
        FPS,
      ),
      backgroundType: "gradient",
      text: r.finalCard.title,
      voiceText: r.finalCard.subtitle,
    },
  ]
  return r
}

export function generateFromContentType(
  contentType: VideoType,
  brief: string,
  channel: StudioChannel,
  generationMode: GenerationMode,
  voiceSpeed: number,
  opts: { ctaText?: string; screenshotUrl?: string },
): VideoRuntime {
  switch (contentType) {
    case "quiz":
      return generateQuizRuntimeFromBrief(brief, channel, generationMode, voiceSpeed, opts.ctaText)
    case "error":
      return generateErrorRuntimeFromBrief(brief, channel, generationMode, voiceSpeed, opts.ctaText)
    case "motivacion":
      return generateMotivationRuntimeFromBrief(brief, channel, generationMode, voiceSpeed, opts.ctaText)
    case "datos_curiosos":
    case "storytelling": {
      const r = generateMotivationRuntimeFromBrief(brief, channel, generationMode, voiceSpeed, opts.ctaText)
      return {
        ...r,
        videoType: contentType,
        theme: contentType === "datos_curiosos" ? "datos_curiosos" : "storytelling",
      }
    }
    case "app":
      return generateAppRuntimeFromBrief(
        brief,
        channel,
        generationMode,
        voiceSpeed,
        opts.ctaText,
        opts.screenshotUrl,
      )
    case "marketing":
      return buildPlaceholderMarketingRuntime("five_beat")
    default:
      return generateQuizRuntimeFromBrief(brief, channel, generationMode, voiceSpeed, opts.ctaText)
  }
}

export function generateSampleRuntime(): VideoRuntime {
  return generateQuizRuntimeFromBrief(
    "Rotonda: ¿quién tiene prioridad al entrar?",
    "tiktok",
    "parser",
    1,
    "Probá gratis — link en bio",
  )
}

export function generateSampleRuntimeForType(videoType: VideoType): VideoRuntime {
  const briefs: Record<VideoType, string> = {
    quiz: "Rotonda: ¿quién tiene prioridad al entrar?",
    error: "PARE es igual que CEDA el paso",
    motivacion: "Me da ansiedad el examen de manejo",
    datos_curiosos: "Sabías que muchos confunden prioridad en rotonda",
    storytelling: "Mi primer simulacro del teórico",
    app: "Quiero simulacros como el examen real",
    marketing: "Promo app: practicar el teórico con simulacros reales",
  }
  return generateFromContentType(videoType, briefs[videoType], "reels", "parser", 1, {
    ctaText: "Probá la app gratis hoy",
  })
}
