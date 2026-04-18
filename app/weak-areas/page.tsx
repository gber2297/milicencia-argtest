import Link from "next/link"
import { redirect } from "next/navigation"

import { AppPageHeader } from "@/components/app/app-page-header"
import { PremiumCheckoutLink } from "@/components/app/premium-links"
import { LineChart, Lock, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import { PLAN_LIMITS, getSubscriptionForUser, isPremiumSubscription } from "@/lib/billing"
import { createClient } from "@/lib/supabase/server"
import { getUserPreferences } from "@/lib/user-preferences"

const WeakAreasPage = async () => {
  const user = await requireUser()
  const supabase = await createClient()
  const prefs = await getUserPreferences(supabase, user.id)
  if (!prefs?.onboarding_completed) redirect("/onboarding")

  const sub = await getSubscriptionForUser(supabase, user.id)
  const premium = isPremiumSubscription(sub)

  const { data: weak } = await supabase.rpc("user_weak_categories", {
    p_user_id: user.id,
  })

  const rows = weak ?? []
  const visible = premium ? rows : rows.slice(0, PLAN_LIMITS.weakAreasPreview)
  const hasMoreLocked = !premium && rows.length > visible.length
  const hasData = rows.length > 0

  return (
    <div className="space-y-8">
      <AppPageHeader
        eyebrow="Enfoque"
        title="Áreas a mejorar"
        description="Priorizá categorías donde más fallaste y practicá con un clic."
      />
      <Card className="landing-card-hover p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {premium ? (
              <p className="text-sm font-medium text-zinc-700">Todas las categorías donde registraste errores</p>
            ) : (
              <p className="text-xs text-zinc-600 sm:text-sm">
                Vista previa ({PLAN_LIMITS.weakAreasPreview} categorías) sin suscripción activa.{" "}
                <PremiumCheckoutLink className="font-semibold text-[var(--brand-blue)] hover:underline">
                  Premium: análisis completo
                </PremiumCheckoutLink>
              </p>
            )}
          </div>
          <div className="hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 text-white shadow-lg shadow-blue-600/25 sm:block">
            <LineChart className="size-6" aria-hidden />
          </div>
        </div>

        <div className="mt-4 space-y-2">
        {hasData ? (
          <>
            {visible.map(
              (row: { category_name: string | null; wrong_count: number; category_id: string | null }, index: number) => (
                <div
                  key={`${row.category_id ?? "null"}-${row.category_name ?? index}`}
                  className="flex flex-col gap-3 rounded-2xl border border-white/90 bg-gradient-to-r from-zinc-50/90 to-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="font-medium text-zinc-900">{row.category_name ?? "Sin categoria"}</p>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <p className="text-sm text-zinc-600">
                      <span className="font-medium tabular-nums text-zinc-800">{row.wrong_count}</span> fallos
                    </p>
                    <Link href={row.category_id ? `/practice/session?categoryId=${row.category_id}` : "/practice/session"}>
                      <Button variant="outline" className="w-full sm:w-auto">
                        Practicar
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            {hasMoreLocked && (
              <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-dashed border-amber-200/90 bg-gradient-to-r from-amber-50/50 to-orange-50/30 p-4 sm:flex-row">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                  <Lock className="size-4 shrink-0" aria-hidden />
                  {rows.length - visible.length} categorías más en Premium
                </div>
                <PremiumCheckoutLink appearance="primary" className="h-9 w-full px-4 text-sm sm:w-auto">
                  Desbloquear
                </PremiumCheckoutLink>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200/90 bg-gradient-to-b from-zinc-50/80 to-white px-5 py-10 text-center sm:px-8 sm:py-12">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <Sparkles className="size-6" aria-hidden />
            </div>
            <p className="mt-4 text-sm font-semibold text-zinc-800">Todavía no hay suficientes datos</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-600">
              Practicá un poco más y volvé: vamos a detectar categorías donde conviene enfocarte.
            </p>
            <Link href="/practice/session" className="mt-6 inline-block">
              <Button>Ir a practica</Button>
            </Link>
          </div>
        )}
        </div>
      </Card>
    </div>
  )
}

export default WeakAreasPage
