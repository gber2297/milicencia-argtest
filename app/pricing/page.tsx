import type { Metadata } from "next"
import { Check } from "lucide-react"

import { MercadoPagoBillingSubscribeForm, PremiumCheckoutLink } from "@/components/app/premium-links"
import { Card } from "@/components/ui/card"
import { getPremiumCheckoutHref, getWeeklyCheckoutHref, isExternalCheckoutUrl } from "@/lib/checkout"
import { isMercadoPagoSubscriptionsApiConfigured } from "@/lib/mercadopago/config"

export const metadata: Metadata = {
  title: "Planes y precios | Mi Licencia",
  description: "Plan semanal o mensual para practicar el teórico con simulacros y estadísticas completas.",
}

const PricingPage = () => {
  const weeklyHref = getWeeklyCheckoutHref()
  const monthlyHref = getPremiumCheckoutHref()
  const hasWeeklyMp = isExternalCheckoutUrl(weeklyHref)
  const hasMonthlyMp = isExternalCheckoutUrl(monthlyHref)
  const apiSubscriptions = isMercadoPagoSubscriptionsApiConfigured()

  return (
    <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:gap-10">
      <Card className="flex flex-col rounded-3xl border-2 border-blue-200/80 bg-gradient-to-br from-blue-50/95 to-white p-6 sm:p-8">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Plan semanal</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Preparación intensa si tenés el examen en poco tiempo.
        </p>
        <p className="mt-6 text-4xl font-bold tracking-tight text-zinc-900">
          $4.990<span className="text-lg font-medium text-zinc-500">/semana</span>
        </p>
        <ul className="mt-6 space-y-2.5 text-sm text-zinc-700">
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
            Práctica y simulacros durante el período contratado
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
            Estadísticas y áreas débiles completas
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
            Renovación semanal según el medio de pago
          </li>
        </ul>
        {apiSubscriptions ? (
          <MercadoPagoBillingSubscribeForm plan="weekly" className="mt-8 w-full sm:w-auto">
            Suscribirme — plan semanal
          </MercadoPagoBillingSubscribeForm>
        ) : (
          <PremiumCheckoutLink subscriptionPlan="weekly" appearance="primary" className="mt-8 w-full sm:w-auto">
            {hasWeeklyMp ? "Suscribirme — plan semanal" : "Ver cómo suscribirme"}
          </PremiumCheckoutLink>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          {apiSubscriptions
            ? "Te pedimos iniciar sesión si hace falta; después te redirigimos a Mercado Pago para el primer pago."
            : hasWeeklyMp
              ? "Ingresá al link, elegí cómo pagar, ¡y listo! Abrimos Mercado Pago en una nueva pestaña."
              : "Cuando configures el link del plan semanal, este botón te llevará al checkout."}
        </p>
      </Card>

      <Card className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-amber-300/60 bg-gradient-to-b from-amber-50/90 via-white to-orange-50/70 p-6 sm:p-8">
        <div className="absolute right-4 top-4 rounded-full bg-amber-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Popular
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Plan mensual</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Mejor precio por día si vas a estudiar varias semanas.
        </p>
        <p className="mt-6 text-4xl font-bold tracking-tight text-zinc-900">
          $8.990<span className="text-lg font-medium text-zinc-500">/mes</span>
        </p>
        <ul className="mt-6 space-y-2.5 text-sm text-zinc-800">
          <li className="flex gap-2 font-medium">
            <Check className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            Todo lo del acceso completo por 30 días
          </li>
          <li className="flex gap-2 font-medium">
            <Check className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            Tiempo para repasar sin apuro
          </li>
          <li className="flex gap-2 font-medium">
            <Check className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            Renovación mensual
          </li>
        </ul>
        {apiSubscriptions ? (
          <MercadoPagoBillingSubscribeForm
            plan="monthly"
            primaryTone="amber"
            className="mt-8 w-full sm:w-auto"
          >
            Suscribirme — plan mensual
          </MercadoPagoBillingSubscribeForm>
        ) : (
          <PremiumCheckoutLink subscriptionPlan="monthly" appearance="primary" primaryTone="amber" className="mt-8 w-full sm:w-auto">
            {hasMonthlyMp ? "Suscribirme — plan mensual" : "Ver cómo suscribirme"}
          </PremiumCheckoutLink>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          {apiSubscriptions
            ? "Te pedimos iniciar sesión si hace falta; después te redirigimos a Mercado Pago para el primer pago."
            : hasMonthlyMp
              ? "Te abrimos el checkout en una nueva pestaña para completar el pago."
              : "Configurá NEXT_PUBLIC_MERCADOPAGO_CHECKOUT_URL con el link del plan mensual en Mercado Pago."}
        </p>
      </Card>
    </div>
  )
}

export default PricingPage
