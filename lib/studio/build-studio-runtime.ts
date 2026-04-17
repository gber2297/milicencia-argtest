import { getRandomQuestionForStudio, hasValidOptionsForStudio } from "@/lib/queries/studio-quiz"
import { buildNarrativeAiRuntime, isNarrativeAiVideoType } from "@/lib/studio/narrative-ai"
import {
  generateFromContentType,
  generateQuizRuntimeFromBrief,
  generateQuizRuntimeFromDbQuestion,
} from "@/lib/studio/generators"
import type { GenerationMode, StudioChannel, VideoType } from "@/types/studio"
import type { VideoRuntime } from "@/types/studio"

interface BuildStudioRuntimeParams {
  brief: string
  contentType: VideoType
  channel: StudioChannel
  generationMode: GenerationMode
  voiceSpeed: number
  cta?: string
  screenshotUrl?: string
}

/** Genera el runtime del Studio; para `quiz` intenta una pregunta aleatoria de `public.questions`. */
export async function buildVideoRuntimeForStudio(
  p: BuildStudioRuntimeParams,
): Promise<VideoRuntime> {
  const { brief, contentType, channel, generationMode, voiceSpeed, cta, screenshotUrl } = p
  if (contentType === "quiz") {
    const row = await getRandomQuestionForStudio()
    if (row && hasValidOptionsForStudio(row.question_options)) {
      const fromDb = generateQuizRuntimeFromDbQuestion(row, brief, channel, generationMode, voiceSpeed, cta)
      if (fromDb) return fromDb
    }
    return generateQuizRuntimeFromBrief(brief, channel, generationMode, voiceSpeed, cta)
  }
  if (generationMode === "full_ai" && isNarrativeAiVideoType(contentType)) {
    return buildNarrativeAiRuntime({
      videoType: contentType,
      brief,
      channel,
    })
  }
  return generateFromContentType(contentType, brief, channel, generationMode, voiceSpeed, {
    ctaText: cta,
    screenshotUrl,
  })
}
