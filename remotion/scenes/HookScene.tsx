import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion"

import { AppSimulatedShell, shellBackgroundUrlFromScene } from "@/remotion/app-simulated/AppSimulatedShell"
import { SceneBackground } from "@/remotion/SceneBackground"
import { useSceneFade } from "@/remotion/useSceneFade"
import type { StudioBranding, StudioScene } from "@/types/studio"

interface HookSceneProps {
  scene: StudioScene
  branding: StudioBranding
  /** Simulación app (Tailwind) para tipos !== quiz */
  appSimulatedUi?: boolean
}

export const HookScene = ({ scene, branding, appSimulatedUi }: HookSceneProps) => {
  const frame = useCurrentFrame()
  const opacity = useSceneFade(scene.durationInFrames, 10)
  const scale = interpolate(frame, [0, 18], [0.96, 1], { extrapolateRight: "clamp" })

  if (appSimulatedUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <AppSimulatedShell
          branding={branding}
          badge="Destacado"
          backgroundImageUrl={shellBackgroundUrlFromScene(scene)}
        >
          <p
            className="text-center text-[2.65rem] font-black leading-[1.08] tracking-tight text-zinc-900"
            style={{
              transform: `scale(${scale})`,
              textAlign: "center",
              fontSize: 42,
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: "rgb(24 24 27)",
              margin: 0,
            }}
          >
            {scene.text ?? ""}
          </p>
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
          padding: 72,
          fontFamily: branding.fontFamily,
        }}
      >
        <p
          style={{
            transform: `scale(${scale})`,
            color: "#f8fafc",
            fontSize: 76,
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1.08,
            letterSpacing: -0.02,
            textShadow: "0 8px 40px rgba(0,0,0,0.45)",
            maxWidth: 940,
          }}
        >
          {scene.text ?? ""}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
