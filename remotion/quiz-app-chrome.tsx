import type { ReactNode } from "react"
import { AbsoluteFill } from "remotion"

import type { StudioBranding } from "@/types/studio"

/** Fondo y tarjeta alineados con la práctica (Card + opciones estilo respuesta). */
export function QuizAppPageBg({ branding, children }: { branding: StudioBranding; children: ReactNode }) {
  return (
    <AbsoluteFill style={{ backgroundColor: "#fafafa", fontFamily: branding.fontFamily }}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 44,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export function QuizAppCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 980,
        backgroundColor: "#ffffff",
        borderRadius: 28,
        border: "1px solid rgba(228, 228, 231, 0.95)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.06), 0 12px 48px -12px rgba(15, 23, 42, 0.12)",
        padding: 44,
      }}
    >
      {children}
    </div>
  )
}

/** Botón estilo `variant="answer"` de la app (práctica). */
export function QuizAppAnswerRow({ label, emphasized }: { label: string; emphasized?: "correct" | "wrong" | "neutral" }) {
  const border =
    emphasized === "correct"
      ? "2px solid #6ee7b7"
      : emphasized === "wrong"
        ? "1px solid rgba(228, 228, 231, 0.95)"
        : "1px solid rgba(228, 228, 231, 0.95)"
  const bg =
    emphasized === "correct"
      ? "linear-gradient(135deg, rgba(236, 253, 245, 0.95), rgba(204, 251, 241, 0.5))"
      : emphasized === "wrong"
        ? "#ffffff"
        : "#ffffff"

  return (
    <div
      style={{
        border,
        background: bg,
        borderRadius: 16,
        padding: "22px 26px",
        marginBottom: 14,
        fontSize: 34,
        fontWeight: 400,
        color: "#27272a",
        lineHeight: 1.35,
        textAlign: "left" as const,
        boxShadow: emphasized === "correct" ? "0 0 0 1px rgba(16, 185, 129, 0.15)" : "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {label}
    </div>
  )
}
