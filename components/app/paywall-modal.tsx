"use client"

import Image from "next/image"
import { useState } from "react"
import { Infinity, Lightbulb, TrendingUp, X } from "lucide-react"

import { PremiumCheckoutLink } from "@/components/app/premium-links"
import { getPremiumCheckoutHref, isExternalCheckoutUrl } from "@/lib/checkout"
import { cn } from "@/lib/utils"

export type PaywallReason = "practice" | "exam" | "weak" | "stats" | "generic"

interface PaywallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason?: PaywallReason
}

const HERO_IMAGE =
  "https://media.screensdesign.com/gasset/411f83ab-cc12-4486-9957-e9d9171792bc.png"

const REASON_COPY: Record<PaywallReason, { line: string }> = {
  practice: { line: "Llegaste al límite diario de práctica sin suscripción activa." },
  exam: { line: "Ya usaste tu simulacro de hoy sin suscripción activa." },
  weak: { line: "El análisis completo de debilidades es Premium." },
  stats: { line: "Las estadísticas avanzadas están en Premium." },
  generic: { line: "Desbloqueá herramientas exclusivas para aprobar más rápido." },
}

export function PaywallModal({ open, onOpenChange, reason = "generic" }: PaywallModalProps) {
  const [plan, setPlan] = useState<"annual" | "monthly">("annual")
  if (!open) return null

  const payWithMp = isExternalCheckoutUrl(getPremiumCheckoutHref())
  const context = REASON_COPY[reason] ?? REASON_COPY.generic

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative z-10 flex max-h-[min(100dvh,920px)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
      >
        <button
          type="button"
          className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200"
          onClick={() => onOpenChange(false)}
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="relative h-56 w-full sm:h-64">
            <Image
              src={HERO_IMAGE}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            <div className="absolute bottom-4 left-8">
              <span className="rounded-full bg-[var(--brand-gold)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
                Oferta limitada
              </span>
            </div>
          </div>

          <div className="px-8 pt-2">
            <p className="text-sm text-zinc-600">{context.line}</p>
            <h2 id="paywall-title" className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-zinc-900">
              Dominá el teórico con Premium
            </h2>
            <p className="mt-3 text-zinc-600">Asegurá tu aprobado con herramientas exclusivas.</p>

            <div className="mt-8 space-y-5">
              <div className="flex gap-4">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[var(--brand-blue)]">
                  <Infinity className="size-3.5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Simulacros ilimitados</p>
                  <p className="text-xs text-zinc-500">Sin límites diarios de preguntas.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[var(--brand-blue)]">
                  <Lightbulb className="size-3.5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Explicaciones detalladas</p>
                  <p className="text-xs text-zinc-500">Entendé el porqué de cada respuesta.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[var(--brand-blue)]">
                  <TrendingUp className="size-3.5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Estadísticas avanzadas</p>
                  <p className="text-xs text-zinc-500">Seguí tu progreso por categorías.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-3 pb-4">
              <button
                type="button"
                onClick={() => setPlan("annual")}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left shadow-sm transition",
                  plan === "annual"
                    ? "border-[var(--brand-blue)] bg-blue-50"
                    : "border-zinc-100 hover:border-zinc-200",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-5 rounded-full border-4",
                      plan === "annual" ? "border-[var(--brand-blue)]" : "border-zinc-200",
                    )}
                  />
                  <div>
                    <p className="font-bold text-zinc-900">Plan Anual</p>
                    <p className="text-[10px] font-bold uppercase text-[var(--brand-blue)]">Ahorrá vs. mensual</p>
                  </div>
                </div>
                <p className="text-right font-extrabold text-zinc-900">
                  Ver precios
                  <span className="block text-[10px] font-normal text-zinc-500">en la página de pago</span>
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPlan("monthly")}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition",
                  plan === "monthly"
                    ? "border-[var(--brand-blue)] bg-blue-50"
                    : "border-zinc-100 hover:border-zinc-200",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-5 rounded-full border-2",
                      plan === "monthly" ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]" : "border-zinc-200",
                    )}
                  />
                  <p className="font-bold text-zinc-900">Plan Mensual</p>
                </div>
                <p className="font-extrabold text-zinc-900">
                  $8.999<span className="text-[10px] font-normal text-zinc-500">/mes</span>
                </p>
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-zinc-100 bg-white p-8 pt-4">
          <PremiumCheckoutLink
            appearance="primary"
            className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-base font-bold text-white shadow-xl shadow-blue-100 hover:brightness-105"
            onNavigate={() => onOpenChange(false)}
          >
            Obtener Premium
          </PremiumCheckoutLink>
          <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-widest text-zinc-400">
            Garantía de satisfacción de 7 días ·{" "}
            {payWithMp ? "Pago con Mercado Pago" : "Elegí tu plan en la página de precios"}
          </p>
        </div>
      </div>
    </div>
  )
}
