import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion"

import { AppSimulatedShell, shellBackgroundUrlFromScene } from "@/remotion/app-simulated/AppSimulatedShell"
import { QuizAppCard, QuizAppPageBg } from "@/remotion/quiz-app-chrome"
import { SceneBackground } from "@/remotion/SceneBackground"
import { useSceneFade } from "@/remotion/useSceneFade"
import type { StudioBranding, StudioScene } from "@/types/studio"

interface PauseSceneProps {
  scene: StudioScene
  branding: StudioBranding
  appQuizUi?: boolean
  appSimulatedUi?: boolean
}

/** Tensión: barra con aceleración (más lento al inicio, aprieta al final). */
export const PauseScene = ({ scene, branding, appQuizUi, appSimulatedUi }: PauseSceneProps) => {
  const frame = useCurrentFrame()
  const opacity = useSceneFade(scene.durationInFrames, 10)
  const pulse = interpolate(frame % 36, [0, 18, 36], [1, 1.02, 1])
  const D = Math.max(1, scene.durationInFrames - 1)
  const t = Math.min(1, frame / D)
  const eased = t * t * (3 - 2 * t)
  const barPct = Math.min(100, eased * 100)

  if (appQuizUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <QuizAppPageBg branding={branding}>
          <QuizAppCard>
            <p
              style={{
                transform: `scale(${pulse})`,
                color: "#18181b",
                fontSize: 44,
                fontWeight: 700,
                textAlign: "center",
                lineHeight: 1.2,
                marginBottom: 36,
              }}
            >
              {scene.text ?? ""}
            </p>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "rgba(228, 228, 231, 0.9)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${barPct}%`,
                  background: `linear-gradient(90deg, ${branding.primaryColor}, ${branding.accentColor})`,
                  borderRadius: 999,
                }}
              />
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
          badge="Acción"
          backgroundImageUrl={shellBackgroundUrlFromScene(scene)}
        >
          <p
            className="text-center text-2xl font-bold leading-snug text-zinc-900"
            style={{ transform: `scale(${pulse})` }}
          >
            {scene.text ?? ""}
          </p>
          <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${barPct}%`,
                background: `linear-gradient(90deg, ${branding.primaryColor}, ${branding.accentColor})`,
              }}
            />
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
        }}
      >
        <p
          style={{
            transform: `scale(${pulse})`,
            color: "#fef08a",
            fontSize: 64,
            fontWeight: 900,
            textAlign: "center",
            letterSpacing: 0.02,
            lineHeight: 1.1,
            maxWidth: 940,
            textShadow: "0 0 48px rgba(250,204,21,0.4)",
          }}
        >
          {scene.text ?? ""}
        </p>
        <div
          style={{
            position: "absolute",
            bottom: 110,
            left: 64,
            right: 64,
            height: 10,
            borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${barPct}%`,
              background: `linear-gradient(90deg, ${branding.primaryColor}, ${branding.accentColor})`,
              borderRadius: 999,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
