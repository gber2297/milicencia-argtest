import Link from "next/link"
import { redirect } from "next/navigation"

import { PremiumCheckoutLink } from "@/components/app/premium-links"
import { BarChart3, BookOpen, CheckCircle2, Lock, Target, XCircle } from "lucide-react"

import { Card } from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import { PLAN_LIMITS, getSubscriptionForUser, isPremiumSubscription } from "@/lib/billing"
import { getCategoryPerformance, getProgressStats } from "@/lib/queries/app"
import { createClient } from "@/lib/supabase/server"
import { getUserPreferences } from "@/lib/user-preferences"
import { formatPercentage } from "@/lib/utils"

const ProgressPage = async () => {
  const user = await requireUser()
  const supabase = await createClient()
  const prefs = await getUserPreferences(supabase, user.id)
  if (!prefs?.onboarding_completed) redirect("/onboarding")

  const sub = await getSubscriptionForUser(supabase, user.id)
  const premium = isPremiumSubscription(sub)

  const stats = await getProgressStats(user.id)
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

  const categoryPreview = premium
    ? categoryPerformance.slice(0, 8)
    : categoryPerformance.slice(0, PLAN_LIMITS.progressCategoriesPreview)
  const hasMoreCategories = !premium && categoryPerformance.length > categoryPreview.length

  const topStats = [
    { label: "Total respondidas", value: String(stats.totalAnswered), icon: BookOpen, accent: "from-blue-600 to-blue-700" },
    { label: "Correctas", value: String(stats.totalCorrect), icon: CheckCircle2, accent: "from-emerald-600 to-teal-600" },
    { label: "Incorrectas", value: String(stats.totalWrong), icon: XCircle, accent: "from-rose-500 to-orange-600" },
    {
      label: "Precision global",
      value: formatPercentage(stats.accuracy),
      icon: Target,
      accent: "from-violet-600 to-indigo-600",
    },
  ] as const

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Progreso</h1>
        <p className="mt-1 text-sm text-zinc-600 sm:text-base">Resumen de tu actividad y rendimiento.</p>
        {!premium && (
          <p className="mt-2 text-xs text-zinc-500">
            Estadisticas avanzadas por categoria son Premium.{" "}
            <PremiumCheckoutLink className="font-medium text-blue-700 hover:underline">
              Ver beneficios
            </PremiumCheckoutLink>
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {topStats.map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">{value}</p>
              </div>
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}
              >
                <Icon className="size-5" aria-hidden />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <Card className="p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Categoria mas fuerte</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            {strongestCategory ? `${strongestCategory.categoryName} (${formatPercentage(strongestCategory.accuracy)})` : "—"}
          </p>
        </Card>
        <Card className="p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Categoria a reforzar</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            {weakestCategory ? `${weakestCategory.categoryName} (${formatPercentage(weakestCategory.accuracy)})` : "—"}
          </p>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-blue-600" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Rendimiento por categoria</h2>
        </div>
        <div className="mt-4 space-y-2">
          {categoryPerformance.length ? (
            <>
              {categoryPreview.map((item) => (
                <div
                  key={`${item.categoryId}-${item.categoryName}`}
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 text-sm transition hover:border-zinc-300/80"
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
              {hasMoreCategories && (
                <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-dashed border-amber-200/90 bg-amber-50/40 p-4 sm:flex-row">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-950">
                    <Lock className="size-4 shrink-0" aria-hidden />
                    {categoryPerformance.length - categoryPreview.length} categorias mas con Premium
                  </div>
                  <PremiumCheckoutLink appearance="primary" className="h-9 w-full px-4 text-sm sm:w-auto">
                    Pasar a Premium
                  </PremiumCheckoutLink>
                </div>
              )}
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/50 px-4 py-6 text-center text-sm text-zinc-600">
              Responde preguntas para ver analiticas por categoria.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Sesiones recientes</h2>
        <div className="mt-4 space-y-2">
          {recentExams?.length ? (
            recentExams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-sm"
              >
                <p className="text-zinc-700">{new Date(exam.started_at).toLocaleDateString("es-AR")}</p>
                <p className="font-semibold tabular-nums text-zinc-900">{formatPercentage(exam.score_percentage)}</p>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/50 px-4 py-6 text-center text-sm text-zinc-600">
              Aun no tenes examenes completados.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ProgressPage
