"use client"

import { Sparkles, X } from "lucide-react"

import { PremiumCheckoutLink } from "@/components/app/premium-links"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getPremiumCheckoutHref, isExternalCheckoutUrl } from "@/lib/checkout"
import { cn } from "@/lib/utils"

export type PaywallReason = "practice" | "exam" | "weak" | "stats" | "generic"

interface PaywallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason?: PaywallReason
}

const COPY: Record<PaywallReason, { title: string; subtitle: string }> = {
  practice: {
    title: "Aprobá más rápido",
    subtitle: "Llegaste al limite diario de practica gratis. Premium desbloquea practica ilimitada.",
  },
  exam: {
    title: "Aprobá más rápido",
    subtitle: "Ya usaste tu simulacro gratis de hoy. Con Premium seguis entrenando sin tope.",
  },
  weak: {
    title: "Aprobá más rápido",
    subtitle: "El analisis completo de debilidades es Premium.",
  },
  stats: {
    title: "Aprobá más rápido",
    subtitle: "Las estadisticas avanzadas te muestran donde invertir tiempo.",
  },
  generic: {
    title: "Aprobá más rápido",
    subtitle: "Usuarios premium mejoran hasta 2x más rápido.",
  },
}

export function PaywallModal({ open, onOpenChange, reason = "generic" }: PaywallModalProps) {
  if (!open) return null

  const { title, subtitle } = COPY[reason] ?? COPY.generic
  const checkoutHref = getPremiumCheckoutHref()
  const payWithMp = isExternalCheckoutUrl(checkoutHref)

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={() => onOpenChange(false)}
      />
      <Card className="relative z-10 w-full max-w-md border-zinc-200/90 p-5 shadow-2xl sm:p-6">
        <button
          type="button"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          onClick={() => onOpenChange(false)}
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>
        <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
          <Sparkles className="size-6" aria-hidden />
        </div>
        <h2 className="pr-8 text-xl font-semibold tracking-tight text-zinc-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{subtitle}</p>
        <p className="mt-1 text-sm font-medium text-zinc-700">Usuarios premium mejoran hasta 2x más rápido</p>

        <ul className="mt-4 space-y-2 text-sm text-zinc-700">
          {[
            "Practicas ilimitadas",
            "Simulacros ilimitados",
            "Analisis de errores completo",
            "Todas las categorias",
            "Progreso y estadisticas completas",
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
              {line}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" className={cn("w-full sm:w-auto")} type="button" onClick={() => onOpenChange(false)}>
            Seguir con el plan gratis
          </Button>
          <PremiumCheckoutLink
            appearance="primary"
            className="w-full sm:w-auto"
            onNavigate={() => onOpenChange(false)}
          >
            Pasar a Premium
          </PremiumCheckoutLink>
        </div>
        <p className="mt-3 text-center text-xs text-zinc-500">
          {payWithMp ? "Pago con Mercado Pago." : "Elegí tu plan en la página de precios."}
        </p>
      </Card>
    </div>
  )
}
