import type { ComponentType } from "react"
import { Composition } from "remotion"

import { VideoComposition } from "@/remotion/VideoComposition"
import { calculateCompositionDuration } from "@/remotion/voice-timeline"
import { buildPlaceholderMarketingRuntime } from "@/lib/studio/marketing-templates"
import { generateSampleRuntime } from "@/lib/studio/generators"

/** Raíz Remotion CLI (`npx remotion render …`) y preview futuro. Next usa `@remotion/player` con `VideoComposition`. */
export const RemotionRoot = () => {
  const sample = generateSampleRuntime()
  const marketing = buildPlaceholderMarketingRuntime("five_beat")
  const durStudio = calculateCompositionDuration(sample)
  const durMarketing = calculateCompositionDuration(marketing)

  return (
    <>
      <Composition
        id="MiLicenciaVideo"
        component={VideoComposition as unknown as ComponentType<Record<string, unknown>>}
        durationInFrames={durStudio}
        fps={sample.fps}
        width={sample.width}
        height={sample.height}
        defaultProps={{ runtime: sample }}
      />
      <Composition
        id="AppMarketingVideo"
        component={VideoComposition as unknown as ComponentType<Record<string, unknown>>}
        durationInFrames={durMarketing}
        fps={marketing.fps}
        width={marketing.width}
        height={marketing.height}
        defaultProps={{ runtime: marketing }}
      />
    </>
  )
}

/** @deprecated Usar `RemotionRoot` */
export const RemotionStudioRoot = RemotionRoot
