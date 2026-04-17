import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion"

import { AppSimulatedShell, shellBackgroundUrlFromScene } from "@/remotion/app-simulated/AppSimulatedShell"
import { QuizAppCard, QuizAppPageBg } from "@/remotion/quiz-app-chrome"
import { SceneBackground } from "@/remotion/SceneBackground"
import { useSceneFade } from "@/remotion/useSceneFade"
import type { StudioBranding, StudioScene } from "@/types/studio"

interface ExplanationSceneProps {
  scene: StudioScene
  branding: StudioBranding
  appQuizUi?: boolean
  appSimulatedUi?: boolean
}

export const ExplanationScene = ({ scene, branding, appQuizUi, appSimulatedUi }: ExplanationSceneProps) => {
  const frame = useCurrentFrame()
  const opacity = useSceneFade(scene.durationInFrames, 10)
  const y = interpolate(frame, [0, 14], [14, 0], { extrapolateRight: "clamp" })

  if (appQuizUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <QuizAppPageBg branding={branding}>
          <QuizAppCard>
            <p
              style={{
                transform: `translateY(${y}px)`,
                color: "#3f3f46",
                fontSize: 40,
                fontWeight: 500,
                textAlign: "center",
                lineHeight: 1.35,
                margin: 0,
              }}
            >
              {scene.text ?? ""}
            </p>
          </QuizAppCard>
        </QuizAppPageBg>
      </AbsoluteFill>
    )
  }

  if (appSimulatedUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <AppSimulatedShell
          branding={branding}
          badge="Tip"
          backgroundImageUrl={shellBackgroundUrlFromScene(scene)}
        >
          <div
            className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 text-[1.05rem] leading-relaxed text-emerald-950"
            style={{ transform: `translateY(${y}px)` }}
          >
            <p className="font-semibold text-emerald-900">Explicación</p>
            <p className="mt-2 font-normal">{scene.text ?? ""}</p>
          </div>
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
            color: "#e2e8f0",
            fontSize: 48,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.22,
            maxWidth: 980,
          }}
        >
          {scene.text ?? ""}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
