import type { ReactNode } from "react"
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion"

import { WaitForFonts } from "@/remotion/WaitForFonts"
import { buildSceneTimeline, calculateCompositionDuration } from "@/remotion/voice-timeline"
import { SceneRenderer } from "@/remotion/SceneRenderer"
import type { VideoRuntime } from "@/types/studio"

export const VIDEO_COMPOSITION_ID = "MiLicenciaVideo"

export interface VideoCompositionProps {
  runtime: VideoRuntime
}

function publicPathToStaticFile(publicPath: string): string {
  return publicPath.replace(/^\//, "")
}

export const VideoComposition = ({ runtime }: VideoCompositionProps) => {
  const audio = runtime.audio
  const totalFrames = calculateCompositionDuration(runtime)
  /** Mismo valor que al calcular frames desde MP3 (`voice-segment-frames.json`). */
  const playbackRate = audio?.voicePlaybackRate ?? 1

  const voiceOver = audio?.voiceOverSrc?.trim()
  const ttsMusic = audio?.musicSrc?.trim()
  const userMusic = runtime.music?.enabled ? runtime.music?.url?.trim() : ""
  const musicSrc = ttsMusic || userMusic || ""
  const musicEnabled = Boolean(musicSrc)

  const firstCtaIndex = runtime.scenes.findIndex((s) => s.type === "cta")
  const narrativeFour = runtime.meta?.audioLayout === "narrative_four"
  const vfLen = audio?.voiceSegmentFrames?.length ?? 0
  const timeline = buildSceneTimeline(runtime)

  return (
    <AbsoluteFill
      className="font-sans antialiased"
      style={{
        backgroundColor: runtime.branding.secondaryColor,
        fontFamily: runtime.branding.fontFamily,
      }}
    >
      <WaitForFonts />
      {voiceOver ? (
        <Sequence from={0} durationInFrames={totalFrames}>
          <Audio src={staticFile(publicPathToStaticFile(voiceOver))} playbackRate={playbackRate} />
        </Sequence>
      ) : null}

      {musicEnabled ? (
        <Sequence from={0} durationInFrames={totalFrames}>
          <Audio src={staticFile(publicPathToStaticFile(musicSrc!))} volume={0.12} loop />
        </Sequence>
      ) : null}

      {timeline.map(({ scene, sceneIndex, from, durationInFrames }) => {
        let voiceEl: ReactNode = null
        if (!voiceOver) {
          if (
            narrativeFour &&
            sceneIndex < vfLen &&
            audio?.voiceSegmentSrcs?.[sceneIndex]
          ) {
            voiceEl = (
              <Audio
                src={staticFile(publicPathToStaticFile(audio.voiceSegmentSrcs[sceneIndex]!))}
                playbackRate={playbackRate}
              />
            )
          } else if (
            !narrativeFour &&
            sceneIndex < 5 &&
            audio?.voiceSegmentSrcs?.[sceneIndex]
          ) {
            voiceEl = (
              <Audio
                src={staticFile(publicPathToStaticFile(audio.voiceSegmentSrcs[sceneIndex]!))}
                playbackRate={playbackRate}
              />
            )
          } else if (
            !narrativeFour &&
            scene.type === "cta" &&
            sceneIndex === firstCtaIndex &&
            audio?.ctaVoiceSrc
          ) {
            voiceEl = (
              <Audio
                src={staticFile(publicPathToStaticFile(audio.ctaVoiceSrc))}
                playbackRate={playbackRate}
              />
            )
          }
        }

        return (
          <Sequence key={scene.id} from={from} durationInFrames={durationInFrames}>
            {voiceEl}
            <SceneRenderer scene={scene} runtime={runtime} />
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
