"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import {
  getPremiumCheckoutHref,
  getWeeklyCheckoutHref,
  isExternalCheckoutUrl,
  isMercadoPagoSubscriptionsApiPublicEnabled,
} from "@/lib/checkout"
import {
  premiumSubscribeOutlineClass,
  premiumSubscribePrimaryAmberClass,
  premiumSubscribePrimaryClass,
} from "@/lib/premium-subscribe-classes"
import { cn } from "@/lib/utils"

interface PremiumCheckoutLinkProps {
  children: React.ReactNode
  className?: string
  appearance?: "text" | "primary" | "outline"
  /** Solo con appearance primary */
  primaryTone?: "blue" | "amber"
  /** Plan semanal → link de suscripción MP; mensual → `NEXT_PUBLIC_MERCADOPAGO_CHECKOUT_URL` o /pricing */
  subscriptionPlan?: "weekly" | "monthly"
  /**
   * Si true, siempre va a `/pricing` para elegir plan (no POST directo con plan mensual por defecto).
   * Usalo en CTAs genéricos (“Ver planes”, “Premium” en nav).
   */
  choosePlanFirst?: boolean
  onNavigate?: () => void
  /** Texto mientras se envía el POST a `/api/billing/mp-subscribe` */
  billingPendingLabel?: string
}

interface MpSubscribeFormProps {
  subscriptionPlan: "weekly" | "monthly"
  primaryTone: "blue" | "amber"
  appearance: "text" | "primary" | "outline"
  className?: string
  children: React.ReactNode
  runAfterNavigate?: () => void
  pendingLabel: string
}

/** POST a `/api/billing/mp-subscribe` con estado de carga (ej. `/pricing` sin duplicar lógica). */
export function MercadoPagoBillingSubscribeForm({
  plan,
  primaryTone = "blue",
  className,
  children,
  billingPendingLabel = "Conectando con Mercado Pago…",
}: {
  plan: "weekly" | "monthly"
  primaryTone?: "blue" | "amber"
  className?: string
  children: React.ReactNode
  billingPendingLabel?: string
}) {
  return (
    <MpSubscribeForm
      subscriptionPlan={plan}
      primaryTone={primaryTone}
      appearance="primary"
      className={className}
      pendingLabel={billingPendingLabel}
    >
      {children}
    </MpSubscribeForm>
  )
}

function MpSubscribeForm({
  subscriptionPlan,
  primaryTone,
  appearance,
  className,
  children,
  runAfterNavigate,
  pendingLabel,
}: MpSubscribeFormProps) {
  const [pending, setPending] = useState(false)

  const appearanceClass =
    appearance === "primary"
      ? primaryTone === "amber"
        ? premiumSubscribePrimaryAmberClass
        : premiumSubscribePrimaryClass
      : appearance === "outline"
        ? premiumSubscribeOutlineClass
        : undefined

  return (
    <form
      action="/api/billing/mp-subscribe"
      method="POST"
      className={cn(appearance === "text" ? "inline" : "w-full")}
      onSubmit={() => setPending(true)}
    >
      <input type="hidden" name="plan" value={subscriptionPlan} />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={cn(
          appearanceClass,
          appearance === "text" && "font-semibold text-[var(--brand-blue)] underline hover:no-underline",
          className,
          pending && "cursor-wait opacity-[0.92]",
        )}
        onClick={runAfterNavigate}
      >
        {pending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="size-[1.1em] shrink-0 animate-spin" aria-hidden />
            {pendingLabel}
          </span>
        ) : (
          children
        )}
      </button>
    </form>
  )
}

export function PremiumCheckoutLink({
  children,
  className,
  appearance = "text",
  primaryTone = "blue",
  subscriptionPlan = "monthly",
  choosePlanFirst = false,
  onNavigate,
  billingPendingLabel = "Conectando con Mercado Pago…",
}: PremiumCheckoutLinkProps) {
  const appearanceClass =
    appearance === "primary"
      ? primaryTone === "amber"
        ? premiumSubscribePrimaryAmberClass
        : premiumSubscribePrimaryClass
      : appearance === "outline"
        ? premiumSubscribeOutlineClass
        : undefined

  // Cerrar el padre (ej. modal) en el siguiente macrotask: si cerramos en el mismo click,
  // React desmonta el <form> antes del submit nativo y el POST a MP no llega a ejecutarse.
  const runAfterNavigate = onNavigate
    ? () => {
        setTimeout(() => onNavigate(), 0)
      }
    : undefined

  if (choosePlanFirst) {
    return (
      <Link
        href="/pricing"
        className={cn(
          appearanceClass,
          appearance === "text" && "font-semibold text-[var(--brand-blue)] underline hover:no-underline",
          className,
        )}
        onClick={runAfterNavigate}
      >
        {children}
      </Link>
    )
  }

  const href = subscriptionPlan === "weekly" ? getWeeklyCheckoutHref() : getPremiumCheckoutHref()
  const external = isExternalCheckoutUrl(href)

  if (isMercadoPagoSubscriptionsApiPublicEnabled()) {
    return (
      <MpSubscribeForm
        subscriptionPlan={subscriptionPlan}
        primaryTone={primaryTone}
        appearance={appearance}
        className={className}
        runAfterNavigate={runAfterNavigate}
        pendingLabel={billingPendingLabel}
      >
        {children}
      </MpSubscribeForm>
    )
  }

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(appearanceClass, className)}
      onClick={runAfterNavigate}
    >
      {children}
    </Link>
  )
}
