import { redirect } from "next/navigation"

import { AppPageHeader } from "@/components/app/app-page-header"
import { PremiumCheckoutLink } from "@/components/app/premium-links"
import { BarChart3, BookOpen, CheckCircle2, Target, XCircle } from "lucide-react"

import { Card } from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import { getSubscriptionForUser, isPremiumSubscription } from "@/lib/billing"
import { getCategoryPerformance, getProgressStats } from "@/lib/queries/app"
import { createClient } from "@/lib/supabase/server"
import { getUserPreferences } from "@/lib/user-preferences"
import { computeMasteryProgress } from "@/lib/usage"
import { formatPercentage } from "@/lib/utils"

const ProgressPage = async () => {
  const user = await requireUser()
  const supabase = await createClient()
  const prefs = await getUserPreferences(supabase, user.id)
  if (!prefs?.onboarding_completed) redirect("/onboarding")

  const sub = await getSubscriptionForUser(supabase, user.id)
  const premium = isPremiumSubscription(sub)

  if (!premium) {
    return (
      <div className="space-y-8 sm:space-y-10">
        <AppPageHeader
          eyebrow="Estadísticas"
          title="Progreso"
          description="Resumen de tu actividad y rendimiento por categoría."
        />
        <Card className="landing-card-hover border-amber-100/80 bg-gradient-to-br from-amber-50/80 to-white p-6 sm:p-8">
          <p className="text-sm text-zinc-700">
            Las estadísticas de progreso están disponibles con suscripción activa. Suscribite para ver precisión, categorías
            y simulacros recientes.
          </p>
          <PremiumCheckoutLink appearance="primary" choosePlanFirst className="mt-6 inline-flex">
            Ver planes
          </PremiumCheckoutLink>
        </Card>
      </div>
    )
  }

  const stats = await getProgressStats(user.id)
  const masteryPercent = computeMasteryProgress({
    accuracy: stats.accuracy,
    totalAnswered: stats.totalAnswered,
  })
  const categoryPerformance = await getCategoryPerformance(user.id)
  const strongestCategory = [...categoryPerformance].sort((a, b) => b.accuracy - a.accuracy)[0]
  const weakestCategory = [...categoryPerformance]
    .filter((item) => item.total >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)[0]

  const { data: recentExams } = await supabase
    .from("exam_sessions")
    .select("id, score_percentage, started_at")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(8)

  const categoryPreview = categoryPerformance.slice(0, 8)

  const topStats = [
    { label: "Total respondidas", value: String(stats.totalAnswered), icon: BookOpen, accent: "from-blue-600 to-blue-700" },
    { label: "Correctas", value: String(stats.totalCorrect), icon: CheckCircle2, accent: "from-emerald-600 to-teal-600" },
    { label: "Incorrectas", value: String(stats.totalWrong), icon: XCircle, accent: "from-rose-500 to-orange-600" },
    {
      label: "Precisión global",
      value: formatPercentage(stats.accuracy),
      icon: Target,
      accent: "from-violet-600 to-indigo-600",
    },
  ] as const

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="space-y-4">
        <AppPageHeader
          eyebrow="Estadísticas"
          title="Progreso"
          description="Resumen de tu actividad y rendimiento por categoría."
          progressPercent={masteryPercent}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {topStats.map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} className="landing-card-hover p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-zinc-900">{value}</p>
              </div>
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}
              >
                <Icon className="size-5" aria-hidden />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="landing-card-hover p-6 sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Categoría más fuerte</p>
          <p className="mt-2 text-lg font-bold text-zinc-900">
            {strongestCategory ? `${strongestCategory.categoryName} (${formatPercentage(strongestCategory.accuracy)})` : "—"}
          </p>
        </Card>
        <Card className="landing-card-hover p-6 sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Categoría a reforzar</p>
          <p className="mt-2 text-lg font-bold text-zinc-900">
            {weakestCategory ? `${weakestCategory.categoryName} (${formatPercentage(weakestCategory.accuracy)})` : "—"}
          </p>
        </Card>
      </div>

      <Card className="landing-card-hover p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
            <BarChart3 className="size-5" aria-hidden />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Rendimiento por categoría</h2>
        </div>
        <div className="mt-5 space-y-2.5">
          {categoryPerformance.length ? (
            <>
              {categoryPreview.map((item) => (
                <div
                  key={`${item.categoryId}-${item.categoryName}`}
                  className="rounded-2xl border border-white/80 bg-gradient-to-r from-zinc-50/80 to-white p-4 text-sm shadow-sm transition hover:border-blue-100 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-zinc-900">{item.categoryName}</p>
                    <p className="tabular-nums font-semibold text-zinc-700">{formatPercentage(item.accuracy)}</p>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-600">
                    Correctas: {item.correct} · Incorrectas: {item.wrong}
                  </p>
                </div>
              ))}
            </>
          ) : (
            <p className="rounded-2xl border border-dashed border-zinc-200/90 bg-zinc-50/60 px-4 py-8 text-center text-sm text-zinc-600">
              Respondé preguntas para ver analíticas por categoría.
            </p>
          )}
        </div>
      </Card>

      <Card className="landing-card-hover p-6 sm:p-7">
        <h2 className="text-lg font-bold tracking-tight text-zinc-900">Sesiones recientes</h2>
        <div className="mt-5 space-y-2">
          {recentExams?.length ? (
            recentExams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/90 bg-white/80 px-4 py-3 text-sm shadow-sm"
              >
                <p className="text-zinc-700">{new Date(exam.started_at).toLocaleDateString("es-AR")}</p>
                <p className="font-semibold tabular-nums text-zinc-900">{formatPercentage(exam.score_percentage)}</p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-zinc-200/90 bg-zinc-50/60 px-4 py-8 text-center text-sm text-zinc-600">
              Todavía no tenés exámenes completados.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ProgressPage
