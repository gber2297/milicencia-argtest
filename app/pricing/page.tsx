import { Check } from "lucide-react"

import { PremiumCheckoutLink } from "@/components/app/premium-links"
import { Card } from "@/components/ui/card"
import { PLAN_LIMITS } from "@/lib/billing"
import { getPremiumCheckoutHref, isExternalCheckoutUrl } from "@/lib/checkout"

const PricingPage = () => {
  const checkoutHref = getPremiumCheckoutHref()
  const hasMercadoPago = isExternalCheckoutUrl(checkoutHref)

  return (
    <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2 md:gap-6">
      <Card className="flex flex-col p-6 sm:p-8">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Plan Gratis</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">Empezá sin tarjeta. Ideal para probar el ritmo del examen.</p>
        <p className="mt-6 text-4xl font-bold tracking-tight text-zinc-900">
          $0<span className="text-lg font-medium text-zinc-500">/mes</span>
        </p>
        <ul className="mt-6 space-y-2.5 text-sm text-zinc-700">
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
            Hasta {PLAN_LIMITS.freePracticePerDay} preguntas de practica por dia
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
            {PLAN_LIMITS.freeExamPerDay} simulacro completo por dia
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
            Vista previa de areas debiles ({PLAN_LIMITS.weakAreasPreview} categorias)
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
            Estadisticas basicas (progreso limitado por categoria)
          </li>
        </ul>
      </Card>
      <Card className="relative flex flex-col overflow-hidden border-blue-200/80 bg-gradient-to-b from-white to-blue-50/40 p-6 sm:p-8">
        <div className="absolute right-4 top-4 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {hasMercadoPago ? "Mercado Pago" : "Proximamente"}
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Plan Premium</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Practicá sin fricción, analizá errores en profundidad y seguí tu evolución completa.
        </p>
        <p className="mt-6 text-4xl font-bold tracking-tight text-zinc-900">
          $8.999<span className="text-lg font-medium text-zinc-500">/mes</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-800">
          <li className="flex gap-2 font-medium">
            <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
            Practica y simulacros ilimitados
          </li>
          <li className="flex gap-2 font-medium">
            <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
            Estadisticas completas por categoria
          </li>
          <li className="flex gap-2 font-medium">
            <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
            Analisis completo de areas debiles
          </li>
          <li className="flex gap-2 font-medium">
            <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
            Prioridad para nuevas funciones
          </li>
        </ul>
        <PremiumCheckoutLink appearance="primary" className="mt-8 w-full sm:w-auto">
          {hasMercadoPago ? "Suscribirme con Mercado Pago" : "Ver como activar Premium"}
        </PremiumCheckoutLink>
        <p className="mt-3 text-xs text-zinc-500">
          {hasMercadoPago
            ? "Te abrimos Mercado Pago en una nueva pestaña para completar el pago."
            : "Cuando configures el link de cobro (Mercado Pago), este boton te llevara directo al checkout."}
        </p>
      </Card>
    </div>
  )
}

export default PricingPage
