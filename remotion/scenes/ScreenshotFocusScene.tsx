import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion"

import { AppSimulatedShell, shellBackgroundUrlFromScene } from "@/remotion/app-simulated/AppSimulatedShell"
import { SceneBackground } from "@/remotion/SceneBackground"
import { useSceneFade } from "@/remotion/useSceneFade"
import type { StudioBranding, StudioScene } from "@/types/studio"

interface ScreenshotFocusSceneProps {
  scene: StudioScene
  branding: StudioBranding
  appSimulatedUi?: boolean
}

/** Fases: hold 1–2s con zoom suave → pregunta → highlight de respuesta. */
export const ScreenshotFocusScene = ({ scene, branding, appSimulatedUi }: ScreenshotFocusSceneProps) => {
  const frame = useCurrentFrame()
  const opacity = useSceneFade(scene.durationInFrames, 10)
  const url = scene.screenshotUrl?.trim() || scene.backgroundUrl?.trim() || ""
  const D = scene.durationInFrames
  const holdEnd = Math.min(Math.floor(D * 0.4) + 15, 66)
  const questionStart = holdEnd - 6
  const answerStart = Math.floor(D * 0.62)

  const zoom = interpolate(frame, [0, holdEnd], [1, 1.042], { extrapolateRight: "clamp" })
  const panY = interpolate(frame, [0, D], [0, -8], { extrapolateRight: "clamp" })

  const questionOpacity = interpolate(frame, [questionStart, questionStart + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const answerOpacity = interpolate(frame, [answerStart, answerStart + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  const answer = scene.overlayAnswer?.trim()

  if (appSimulatedUi) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <AppSimulatedShell
          branding={branding}
          badge="Captura"
          backgroundImageUrl={shellBackgroundUrlFromScene(scene)}
        >
          <div
            className="relative mx-auto w-full max-w-[880px] overflow-hidden rounded-2xl border-2 border-blue-200/80 bg-zinc-50 shadow-xl shadow-zinc-950/10"
            style={{ transform: `scale(${zoom}) translateY(${panY}px)` }}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="block h-auto min-h-[420px] w-full object-cover" />
            ) : (
              <div
                className="flex min-h-[420px] items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-100 px-8 text-center text-2xl font-bold text-zinc-600"
                style={{ fontFamily: branding.fontFamily }}
              >
                Subí una captura de la app (URL arriba en Studio)
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 min-h-[180px] bg-gradient-to-t from-zinc-950/90 to-transparent" />
            <div
              className="absolute left-7 right-7 text-3xl font-extrabold leading-snug text-white drop-shadow-md"
              style={{ opacity: questionOpacity, bottom: answer ? 100 : 28 }}
            >
              {scene.overlayQuestion ?? scene.text ?? ""}
            </div>
            {answer ? (
              <div
                className="absolute bottom-6 left-7 right-7 rounded-xl border-2 border-emerald-400/70 bg-emerald-300/95 px-4 py-3.5 text-center text-2xl font-black text-emerald-950 shadow-lg"
                style={{ opacity: answerOpacity }}
              >
                ✓ {answer}
              </div>
            ) : null}
          </div>
        </AppSimulatedShell>
      </AbsoluteFill>
    )
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneBackground
        scene={
          url
            ? scene
            : { ...scene, backgroundType: "gradient" as const, backgroundUrl: "", screenshotUrl: "" }
        }
        branding={branding}
      />
      <AbsoluteFill style={{ padding: 40, justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "relative",
            width: "90%",
            maxWidth: 920,
            borderRadius: 22,
            overflow: "hidden",
            border: `3px solid ${branding.primaryColor}55`,
            boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
            transform: `scale(${zoom}) translateY(${panY}px)`,
          }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="block h-auto w-full object-cover" style={{ minHeight: 480 }} />
          ) : (
            <div
              style={{
                minHeight: 480,
                background: `linear-gradient(145deg, ${branding.secondaryColor}, ${branding.primaryColor}55)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f1f5f9",
                fontSize: 36,
                fontWeight: 800,
                fontFamily: branding.fontFamily,
                padding: 36,
                textAlign: "center",
                lineHeight: 1.25,
              }}
            >
              Subí una captura de la app (URL arriba en Studio)
            </div>
          )}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              minHeight: answer ? 200 : 150,
              background: "linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.88) 45%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 28,
              right: 28,
              bottom: answer ? 100 : 28,
              opacity: questionOpacity,
              color: "#f8fafc",
              fontFamily: branding.fontFamily,
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1.25,
              textShadow: "0 4px 24px rgba(0,0,0,0.75)",
            }}
          >
            {scene.overlayQuestion ?? scene.text ?? ""}
          </div>
          {answer ? (
            <div
              style={{
                position: "absolute",
                left: 28,
                right: 28,
                bottom: 26,
                opacity: answerOpacity,
                background: `${branding.accentColor}ee`,
                color: "#052e16",
                fontFamily: branding.fontFamily,
                fontSize: 26,
                fontWeight: 900,
                padding: "14px 18px",
                borderRadius: 14,
                boxShadow: `0 0 0 3px ${branding.accentColor}66`,
              }}
            >
              ✓ {answer}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
