import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion"

import { AppSimulatedShell, shellBackgroundUrlFromScene } from "@/remotion/app-simulated/AppSimulatedShell"
import { QuizAppAnswerRow, QuizAppCard, QuizAppPageBg } from "@/remotion/quiz-app-chrome"
import { SceneBackground } from "@/remotion/SceneBackground"
import { useSceneFade } from "@/remotion/useSceneFade"
import type { StudioBranding, StudioScene } from "@/types/studio"

interface OptionsSceneProps {
  scene: StudioScene
  branding: StudioBranding
  appQuizUi?: boolean
  appSimulatedUi?: boolean
}

export const OptionsScene = ({ scene, branding, appQuizUi, appSimulatedUi }: OptionsSceneProps) => {
  const frame = useCurrentFrame()
  const opacity = useSceneFade(scene.durationInFrames, 10)
  const opts = scene.options ?? []

  if (appQuizUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <QuizAppPageBg branding={branding}>
          <QuizAppCard>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {opts.map((o, i) => {
                const delay = i * 4
                const oOpacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp" })
                const x = interpolate(frame, [delay, delay + 12], [20, 0], { extrapolateRight: "clamp" })
                return (
                  <div key={o.id} style={{ opacity: oOpacity, transform: `translateX(${x}px)` }}>
                    <QuizAppAnswerRow label={o.label} />
                  </div>
                )
              })}
            </div>
          </QuizAppCard>
        </QuizAppPageBg>
      </AbsoluteFill>
    )
  }

  if (appSimulatedUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <AppSimulatedShell branding={branding} backgroundImageUrl={shellBackgroundUrlFromScene(scene)}>
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-400">Opciones</p>
          <div className="flex flex-col gap-2.5">
            {opts.map((o, i) => {
              const delay = i * 4
              const oOpacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp" })
              const x = interpolate(frame, [delay, delay + 12], [16, 0], { extrapolateRight: "clamp" })
              return (
                <div
                  key={o.id}
                  className="rounded-xl border border-zinc-200 bg-white py-3.5 pl-4 pr-3 text-left text-[15px] font-normal leading-snug text-zinc-800 shadow-sm shadow-zinc-950/5"
                  style={{ opacity: oOpacity, transform: `translateX(${x}px)` }}
                >
                  {o.label}
                </div>
              )
            })}
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
          padding: 56,
          fontFamily: branding.fontFamily,
          gap: 22,
        }}
      >
        <div style={{ width: "100%", maxWidth: 960, display: "flex", flexDirection: "column", gap: 20 }}>
          {opts.map((o, i) => {
            const delay = i * 4
            const oOpacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp" })
            const x = interpolate(frame, [delay, delay + 12], [24, 0], { extrapolateRight: "clamp" })
            return (
              <div
                key={o.id}
                style={{
                  opacity: oOpacity,
                  transform: `translateX(${x}px)`,
                  background: "rgba(15,23,42,0.72)",
                  border: `2px solid ${branding.primaryColor}55`,
                  borderRadius: 20,
                  padding: "22px 28px",
                  color: "#f8fafc",
                  fontSize: 44,
                  fontWeight: 700,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                }}
              >
                {o.label}
              </div>
            )
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
