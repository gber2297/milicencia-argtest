import type { ReactNode } from "react"
import { AbsoluteFill } from "remotion"

import { remotionPublicUrl } from "@/remotion/utils/remotion-public-url"
import type { StudioBranding, StudioScene } from "@/types/studio"

/** URL de fondo full-bleed para el modo simulado (stock / captura). */
export function shellBackgroundUrlFromScene(scene: StudioScene): string | undefined {
  if (scene.backgroundType !== "image") return undefined
  const u = (scene.backgroundUrl || scene.screenshotUrl)?.trim()
  if (!u) return undefined
  return remotionPublicUrl(u, "logo.png")
}

/**
 * Simula la app (estructura tipo práctica): shell claro, header con marca + badge, cuerpo en card blanca.
 * Solo para videoType !== "quiz"; el quiz usa `QuizAppPageBg` / escenas dedicadas.
 * Con `backgroundImageUrl` se muestra la imagen de escena (Pexels, etc.) detrás de la card.
 */
export function AppSimulatedShell({
  branding,
  badge = "Práctica",
  backgroundImageUrl,
  children,
}: {
  branding: StudioBranding
  badge?: string
  backgroundImageUrl?: string
  children: ReactNode
}) {
  const { primaryColor, secondaryColor } = branding
  const url = backgroundImageUrl?.trim()

  return (
    <AbsoluteFill
      className="relative overflow-hidden font-sans"
      style={{ position: "relative", overflow: "hidden", fontFamily: "var(--font-geist-sans)" }}
    >
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <AbsoluteFill
            className="pointer-events-none"
            style={{
              pointerEvents: "none",
              background: `linear-gradient(180deg, ${secondaryColor}aa 0%, transparent 38%, ${secondaryColor}dd 100%)`,
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-zinc-100"
          style={{ position: "absolute", inset: 0, backgroundColor: "rgb(244 244 245)" }}
        />
      )}
      <div
        className="relative flex h-full w-full flex-col items-center justify-center px-7 py-10"
        style={{
          position: "relative",
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 28px",
        }}
      >
        <div
          className="w-full max-w-[min(920px,94vw)] overflow-hidden rounded-[28px] border shadow-[0_24px_64px_-12px_rgba(15,23,42,0.22)]"
          style={{
            width: "100%",
            maxWidth: 920,
            overflow: "hidden",
            borderRadius: 28,
            borderStyle: "solid",
            borderWidth: 1,
            boxShadow: "0 24px 64px -12px rgba(15,23,42,0.22)",
            borderColor: url ? `${primaryColor}44` : "rgb(228 228 231 / 0.95)",
            backgroundColor: url ? "rgba(255,255,255,0.96)" : "rgb(255 255 255 / 0.95)",
            backdropFilter: url ? "blur(4px)" : undefined,
          }}
        >
          <header
            className="flex items-center justify-between border-b border-zinc-200/90 bg-zinc-50/95 px-5 py-3.5"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgb(228 228 231 / 0.9)",
              backgroundColor: "rgb(250 250 250 / 0.95)",
              padding: "14px 20px",
            }}
          >
            <div className="flex items-center gap-2" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={remotionPublicUrl(branding.logoUrl)}
                alt=""
                width={28}
                height={28}
                className="rounded-lg object-contain"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  objectFit: "contain",
                }}
              />
              <span
                className="text-[15px] font-semibold tracking-tight text-zinc-900"
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "rgb(24 24 27)",
                }}
              >
                {branding.appName}
              </span>
            </div>
            <span
              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
              style={{
                display: "inline-block",
                borderRadius: 999,
                backgroundColor: "rgb(219 234 254)",
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "rgb(30 64 175)",
              }}
            >
              {badge}
            </span>
          </header>
          <div
            className="min-h-[240px] px-6 py-8"
            style={{
              minHeight: 240,
              padding: "32px 24px",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
