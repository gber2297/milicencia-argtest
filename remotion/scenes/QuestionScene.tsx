import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion"

import { AppSimulatedShell, shellBackgroundUrlFromScene } from "@/remotion/app-simulated/AppSimulatedShell"
import { QuizAppCard, QuizAppPageBg } from "@/remotion/quiz-app-chrome"
import { SceneBackground } from "@/remotion/SceneBackground"
import { useSceneFade } from "@/remotion/useSceneFade"
import type { StudioBranding, StudioScene } from "@/types/studio"

interface QuestionSceneProps {
  scene: StudioScene
  branding: StudioBranding
  appQuizUi?: boolean
  appSimulatedUi?: boolean
}

export const QuestionScene = ({ scene, branding, appQuizUi, appSimulatedUi }: QuestionSceneProps) => {
  const frame = useCurrentFrame()
  const opacity = useSceneFade(scene.durationInFrames, 10)
  const y = interpolate(frame, [0, 16], [18, 0], { extrapolateRight: "clamp" })

  if (appQuizUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <QuizAppPageBg branding={branding}>
          <QuizAppCard>
            <h2
              style={{
                transform: `translateY(${y}px)`,
                color: "#18181b",
                fontSize: 48,
                fontWeight: 600,
                textAlign: "center",
                lineHeight: 1.25,
                letterSpacing: -0.02,
                margin: 0,
              }}
            >
              {scene.text ?? ""}
            </h2>
          </QuizAppCard>
        </QuizAppPageBg>
      </AbsoluteFill>
    )
  }

  if (appSimulatedUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <AppSimulatedShell branding={branding} backgroundImageUrl={shellBackgroundUrlFromScene(scene)}>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-zinc-200 bg-zinc-100/90 px-2.5 py-1 text-xs font-medium text-zinc-700">
              Pregunta
            </span>
          </div>
          <h2
            className="mt-3 text-left text-xl font-semibold leading-snug tracking-tight text-zinc-900 sm:text-[1.35rem]"
            style={{ transform: `translateY(${y}px)` }}
          >
            {scene.text ?? ""}
          </h2>
        </AppSimulatedShell>
      </AbsoluteFill>
    )
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneBackground scene={scene} branding={branding} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 64,
          fontFamily: branding.fontFamily,
        }}
      >
        <p
          style={{
            transform: `translateY(${y}px)`,
            color: "#f1f5f9",
            fontSize: 56,
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.16,
            maxWidth: 980,
            textShadow: "0 6px 32px rgba(0,0,0,0.4)",
          }}
        >
          {scene.text ?? ""}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
