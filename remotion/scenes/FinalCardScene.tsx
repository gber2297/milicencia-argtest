import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion"

import { AppSimulatedShell, shellBackgroundUrlFromScene } from "@/remotion/app-simulated/AppSimulatedShell"
import { remotionPublicUrl } from "@/remotion/utils/remotion-public-url"
import { SceneBackground } from "@/remotion/SceneBackground"
import { useSceneFade } from "@/remotion/useSceneFade"
import type { StudioBranding, StudioFinalCard, StudioScene } from "@/types/studio"

interface FinalCardSceneProps {
  scene: StudioScene
  branding: StudioBranding
  finalCard: StudioFinalCard
  appSimulatedUi?: boolean
}

export const FinalCardScene = ({ scene, branding, finalCard, appSimulatedUi }: FinalCardSceneProps) => {
  const frame = useCurrentFrame()
  const opacity = useSceneFade(scene.durationInFrames, 10)
  const title = finalCard.title
  const subtitle = finalCard.subtitle
  const rise = interpolate(frame, [0, 18], [24, 0], { extrapolateRight: "clamp" })
  const ctaPulse = interpolate(frame % 50, [0, 25, 50], [1, 1.03, 1])

  if (appSimulatedUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <AppSimulatedShell
          branding={branding}
          badge="Cierre"
          backgroundImageUrl={shellBackgroundUrlFromScene(scene)}
        >
          <div className="flex flex-col items-center text-center" style={{ transform: `translateY(${rise}px)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={remotionPublicUrl(branding.logoUrl)}
              alt=""
              width={96}
              height={96}
              className="mb-4 rounded-2xl object-contain"
            />
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Argentina · teórico</p>
            <h3 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">{title}</h3>
            <p className="mt-3 text-lg font-medium text-zinc-600">{subtitle}</p>
            <div
              className="mt-8 inline-flex rounded-full bg-blue-600 px-8 py-3 text-base font-bold text-white shadow-xl shadow-blue-600/20"
              style={{ transform: `scale(${ctaPulse})` }}
            >
              {branding.appName} — gratis
            </div>
            <p className="mt-4 text-sm text-zinc-400">Link en bio · practicá hoy</p>
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
        <div
          style={{
            transform: `translateY(${rise}px)`,
            width: "100%",
            maxWidth: 940,
            borderRadius: 28,
            padding: "44px 40px",
            background: "linear-gradient(165deg, rgba(15,23,42,0.92), rgba(30,41,59,0.88))",
            border: `2px solid ${branding.primaryColor}77`,
            textAlign: "center",
            boxShadow: `0 28px 80px rgba(0,0,0,0.5), 0 0 0 1px ${branding.primaryColor}33`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={remotionPublicUrl(branding.logoUrl)}
            alt=""
            width={140}
            height={140}
            style={{
              margin: "0 auto 16px",
              display: "block",
              objectFit: "contain",
              filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.35))",
            }}
          />
          <p
            style={{
              color: "#e2e8f0",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 0.12,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Argentina · teórico
          </p>
          <p style={{ color: "#f8fafc", fontSize: 58, fontWeight: 900, lineHeight: 1.08 }}>{title}</p>
          <p style={{ marginTop: 16, color: "#cbd5e1", fontSize: 32, fontWeight: 600, lineHeight: 1.3 }}>
            {subtitle}
          </p>
          <div
            style={{
              marginTop: 36,
              display: "inline-block",
              transform: `scale(${ctaPulse})`,
              background: branding.primaryColor,
              color: "#fff",
              fontSize: 30,
              fontWeight: 900,
              padding: "16px 36px",
              borderRadius: 999,
              boxShadow: "0 16px 40px rgba(37,99,235,0.45)",
            }}
          >
            {branding.appName} — gratis
          </div>
          <p style={{ marginTop: 20, color: "#94a3b8", fontSize: 26, fontWeight: 700 }}>Link en bio · practicá hoy</p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
