import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion"

import { AppSimulatedShell, shellBackgroundUrlFromScene } from "@/remotion/app-simulated/AppSimulatedShell"
import { QuizAppCard, QuizAppPageBg } from "@/remotion/quiz-app-chrome"
import { SceneBackground } from "@/remotion/SceneBackground"
import { useSceneFade } from "@/remotion/useSceneFade"
import type { StudioBranding, StudioScene } from "@/types/studio"

interface RevealSceneProps {
  scene: StudioScene
  branding: StudioBranding
  appQuizUi?: boolean
  appSimulatedUi?: boolean
}

export const RevealScene = ({ scene, branding, appQuizUi, appSimulatedUi }: RevealSceneProps) => {
  const frame = useCurrentFrame()
  const opacity = useSceneFade(scene.durationInFrames, 10)
  const opts = scene.options ?? []
  const correctId = scene.correctOptionId

  const wrongFade = interpolate(frame, [8, 22], [1, 0.42], { extrapolateRight: "clamp" })
  const correctPop = interpolate(frame, [16, 28], [0.98, 1.02], { extrapolateRight: "clamp" })
  const badgeIn = interpolate(frame, [22, 32], [0, 1], { extrapolateRight: "clamp" })

  if (appQuizUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <QuizAppPageBg branding={branding}>
          <QuizAppCard>
            <p
              style={{
                color: "#18181b",
                fontSize: 36,
                fontWeight: 800,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {scene.text ?? "Respuesta"}
            </p>
            <div
              style={{
                opacity: badgeIn,
                marginBottom: 22,
                textAlign: "center",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  background: branding.accentColor,
                  color: "#052e16",
                  fontSize: 24,
                  fontWeight: 800,
                  padding: "10px 22px",
                  borderRadius: 999,
                  boxShadow: "0 8px 28px rgba(34,197,94,0.35)",
                }}
              >
                CORRECTO
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {opts.map((o) => {
                const isCorrect = Boolean(correctId && o.id === correctId)
                const dim = isCorrect ? 1 : wrongFade
                const scale = isCorrect ? correctPop : 1
                return (
                  <div
                    key={o.id}
                    style={{
                      opacity: dim,
                      transform: `scale(${scale})`,
                      border: isCorrect ? `2px solid ${branding.accentColor}` : "1px solid rgba(228, 228, 231, 0.95)",
                      background: isCorrect
                        ? "linear-gradient(135deg, rgba(236, 253, 245, 0.98), rgba(167, 243, 208, 0.45))"
                        : "#ffffff",
                      borderRadius: 16,
                      padding: "22px 26px",
                      color: "#27272a",
                      fontSize: 32,
                      fontWeight: isCorrect ? 700 : 400,
                      lineHeight: 1.35,
                      boxShadow: isCorrect ? `0 0 24px ${branding.accentColor}44` : "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    {o.label}
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
        <AppSimulatedShell
          branding={branding}
          badge="Resultado"
          backgroundImageUrl={shellBackgroundUrlFromScene(scene)}
        >
          <p className="mb-4 text-center text-2xl font-extrabold text-zinc-900">{scene.text ?? "Respuesta"}</p>
          <div className="mb-5 text-center" style={{ opacity: badgeIn }}>
            <span
              className="inline-block rounded-full px-5 py-2 text-sm font-extrabold text-emerald-950 shadow-lg"
              style={{ backgroundColor: branding.accentColor, boxShadow: `0 8px 28px ${branding.accentColor}55` }}
            >
              CORRECTO
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {opts.map((o) => {
              const isCorrect = Boolean(correctId && o.id === correctId)
              const dim = isCorrect ? 1 : wrongFade
              const scale = isCorrect ? correctPop : 1
              return (
                <div
                  key={o.id}
                  className={`rounded-2xl border px-5 py-4 text-left text-lg leading-snug ${
                    isCorrect
                      ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 font-bold text-zinc-900 shadow-md"
                      : "border-zinc-200 bg-white font-normal text-zinc-600"
                  }`}
                  style={{ opacity: dim, transform: `scale(${scale})` }}
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
          padding: 48,
          fontFamily: branding.fontFamily,
        }}
      >
        <p
          style={{
            color: "#f1f5f9",
            fontSize: 40,
            fontWeight: 800,
            marginBottom: 12,
            textAlign: "center",
            letterSpacing: -0.02,
            textShadow: "0 4px 24px rgba(0,0,0,0.45)",
          }}
        >
          {scene.text ?? "Respuesta"}
        </p>
        <div
          style={{
            opacity: badgeIn,
            marginBottom: 18,
            background: branding.accentColor,
            color: "#052e16",
            fontSize: 26,
            fontWeight: 900,
            padding: "10px 22px",
            borderRadius: 999,
            boxShadow: "0 8px 28px rgba(34,197,94,0.45)",
          }}
        >
          CORRECTO
        </div>
        <div style={{ width: "100%", maxWidth: 960, display: "flex", flexDirection: "column", gap: 16 }}>
          {opts.map((o) => {
            const isCorrect = Boolean(correctId && o.id === correctId)
            const dim = isCorrect ? 1 : wrongFade
            const scale = isCorrect ? correctPop : 1
            return (
              <div
                key={o.id}
                style={{
                  opacity: dim,
                  transform: `scale(${scale})`,
                  background: isCorrect
                    ? `linear-gradient(95deg, ${branding.accentColor}44, ${branding.accentColor}cc)`
                    : "rgba(15,23,42,0.62)",
                  border: isCorrect ? `3px solid ${branding.accentColor}` : `2px solid ${branding.primaryColor}40`,
                  borderRadius: 18,
                  padding: "22px 28px",
                  color: "#f8fafc",
                  fontSize: 42,
                  fontWeight: 800,
                  lineHeight: 1.2,
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
