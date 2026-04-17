import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion"

import { AppSimulatedShell, shellBackgroundUrlFromScene } from "@/remotion/app-simulated/AppSimulatedShell"
import { remotionPublicUrl } from "@/remotion/utils/remotion-public-url"
import { SceneBackground } from "@/remotion/SceneBackground"
import { useSceneFade } from "@/remotion/useSceneFade"
import type { StudioBranding, StudioCta, StudioScene } from "@/types/studio"

interface CtaSceneProps {
  scene: StudioScene
  branding: StudioBranding
  cta: StudioCta
  appSimulatedUi?: boolean
}

export const CtaScene = ({ scene, branding, cta, appSimulatedUi }: CtaSceneProps) => {
  const frame = useCurrentFrame()
  const opacity = useSceneFade(scene.durationInFrames, 10)
  const text = scene.text?.trim() ? scene.text : cta.text
  const scale = interpolate(frame, [0, 14], [0.94, 1], { extrapolateRight: "clamp" })

  if (appSimulatedUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <AppSimulatedShell
          branding={branding}
          badge="CTA"
          backgroundImageUrl={shellBackgroundUrlFromScene(scene)}
        >
          <div className="flex flex-col items-center gap-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={remotionPublicUrl(branding.logoUrl)}
              alt=""
              width={72}
              height={72}
              className="rounded-2xl object-contain shadow-lg shadow-zinc-950/15"
            />
            <button
              type="button"
              className="w-full max-w-md rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/25 transition-transform"
              style={{ transform: `scale(${scale})` }}
            >
              {text}
            </button>
            <p className="text-sm font-medium text-zinc-500">{branding.appName}</p>
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
          padding: 72,
          fontFamily: branding.fontFamily,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={remotionPublicUrl(branding.logoUrl)}
          alt=""
          width={72}
          height={72}
          style={{
            marginBottom: 20,
            objectFit: "contain",
            borderRadius: 16,
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
          }}
        />
        <div
          style={{
            transform: `scale(${scale})`,
            background: branding.primaryColor,
            color: "#fff",
            fontSize: 48,
            fontWeight: 800,
            padding: "28px 44px",
            borderRadius: 24,
            textAlign: "center",
            maxWidth: 920,
            boxShadow: "0 24px 60px rgba(37,99,235,0.45)",
          }}
        >
          {text}
        </div>
        <p
          style={{
            marginTop: 36,
            color: "#cbd5e1",
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          {branding.appName}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
