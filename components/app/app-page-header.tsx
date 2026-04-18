import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface AppPageHeaderProps {
  title: ReactNode
  description?: string
  eyebrow?: string
  /** 0–100: muestra barra fina de progreso bajo la descripción */
  progressPercent?: number
  className?: string
}

export function AppPageHeader({ title, description, eyebrow, progressPercent, className }: AppPageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-sky-100/50 via-white to-violet-100/35 px-6 py-7 shadow-xl shadow-blue-500/10 sm:px-8 sm:py-9",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-cyan-300/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-12 size-56 rounded-full bg-violet-400/20 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand-blue)]">{eyebrow}</p>
        ) : null}
        <h1
          className={cn(
            "flex flex-wrap items-baseline gap-x-2 gap-y-1 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl",
            eyebrow && "mt-3",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">{description}</p>
        ) : null}
        {typeof progressPercent === "number" ? (
          <div className="mt-5 max-w-md">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-zinc-600">Progreso general</span>
              <span className="tabular-nums text-sm font-bold text-[var(--brand-blue)]">{progressPercent}%</span>
            </div>
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/90 shadow-inner shadow-zinc-900/5 ring-1 ring-zinc-200/40"
              role="progressbar"
              aria-valuenow={Math.min(100, Math.max(0, progressPercent))}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso general ${progressPercent} por ciento`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--landing-cyan)] via-[var(--brand-blue)] to-[var(--landing-violet)] transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
