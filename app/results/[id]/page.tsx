import Link from "next/link"
import { notFound } from "next/navigation"
import { PartyPopper, TrendingDown } from "lucide-react"

import { PremiumCheckoutLink } from "@/components/app/premium-links"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import { getSubscriptionForUser, isPremiumSubscription } from "@/lib/billing"
import { createClient } from "@/lib/supabase/server"
import { formatPercentage } from "@/lib/utils"

interface ResultsPageProps {
  params: Promise<{ id: string }>
}

const ResultsPage = async ({ params }: ResultsPageProps) => {
  const user = await requireUser()
  const { id } = await params
  const supabase = await createClient()

  const { data: exam } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!exam) notFound()

  const sub = await getSubscriptionForUser(supabase, user.id)
  const premium = isPremiumSubscription(sub)

  const { data: wrongByCategory } = await supabase
    .from("exam_session_questions")
    .select("is_correct, questions(categories(name))")
    .eq("exam_session_id", id)
    .eq("is_correct", false)

  const failedCategoryMap = new Map<string, number>()
  wrongByCategory?.forEach((row) => {
    const questionJoin = row.questions as { categories?: { name?: string } | { name?: string }[] } | null
    const categoryObj = Array.isArray(questionJoin?.categories)
      ? questionJoin?.categories[0]
      : questionJoin?.categories
    const categoryName = categoryObj?.name ?? "Sin categoria"
    failedCategoryMap.set(categoryName, (failedCategoryMap.get(categoryName) ?? 0) + 1)
  })
  const failedCategories = [...failedCategoryMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  const noMissedCategories = failedCategories.length === 0
  const scoreNum = Number(exam.score_percentage ?? 0)
  let motivation =
    scoreNum >= 85
      ? "Estás muy cerca de aprobar — consolidá con otro simulacro."
      : scoreNum >= 65
        ? "Estás cerca de aprobar: reforzá las categorias con mas errores."
        : "Seguí practicando: cada simulacro te acerca al objetivo."
  if (!noMissedCategories) {
    motivation = "Te faltan mejorar estas áreas — practicá por categoría para subir rapido."
  }

  return (
    <Card className="landing-card-hover overflow-hidden border-white/90 p-0 shadow-xl shadow-blue-500/10 sm:p-0">
      <div className="relative border-b border-white/60 bg-gradient-to-br from-sky-100/50 via-white to-violet-100/30 px-5 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-cyan-300/25 blur-3xl" aria-hidden />
        <Badge className="relative mb-4 border-blue-100/80 bg-white/90 font-semibold shadow-sm">Resultado final</Badge>
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="relative text-sm font-medium text-zinc-500">Puntuación</p>
            <p className="relative mt-1 text-5xl font-extrabold tracking-tight text-zinc-900 tabular-nums sm:text-6xl">
              {formatPercentage(exam.score_percentage)}
            </p>
            <p className="mt-3 text-sm text-zinc-600">
              Correctas: <span className="font-medium text-zinc-800">{exam.correct_answers}</span> · Incorrectas:{" "}
              <span className="font-medium text-zinc-800">{exam.wrong_answers}</span>
            </p>
            <p className="relative mt-4 max-w-lg text-sm font-medium leading-relaxed text-zinc-700">{motivation}</p>
          </div>
          <div
            className={`relative flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${
              noMissedCategories
                ? "border-emerald-200/90 bg-emerald-50/80 text-emerald-900"
                : "border-amber-200/90 bg-amber-50/80 text-amber-950"
            }`}
          >
            {noMissedCategories ? (
              <PartyPopper className="size-5 shrink-0" aria-hidden />
            ) : (
              <TrendingDown className="size-5 shrink-0" aria-hidden />
            )}
            {noMissedCategories ? "Sin fallos por categoría" : "Hay áreas para reforzar"}
          </div>
        </div>
      </div>

      <div className="space-y-6 bg-white/40 px-5 py-6 sm:px-8 sm:py-8">
        <div>
          <p className="text-sm font-bold text-zinc-900">Categorías con más errores</p>
          <div className="mt-3 space-y-2">
            {failedCategories.length ? (
              failedCategories.map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/90 bg-gradient-to-r from-zinc-50/90 to-white px-4 py-3 text-sm shadow-sm"
                >
                  <span className="font-medium text-zinc-800">{category}</span>
                  <span className="tabular-nums text-zinc-600">
                    {count} {count === 1 ? "error" : "errores"}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900">
                Sin errores en este simulacro. Excelente trabajo.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/exam" className="sm:shrink-0">
            <Button className="w-full sm:w-auto">Reintentar simulacro</Button>
          </Link>
          <Link href="/weak-areas" className="sm:shrink-0">
            <Button variant="secondary" className="w-full sm:w-auto">
              Practicar areas debiles
            </Button>
          </Link>
        </div>
        {!premium && (
          <p className="text-center text-xs text-zinc-500">
            Premium desbloquea practica y simulacros ilimitados.{" "}
            <PremiumCheckoutLink className="font-semibold text-[var(--brand-blue)] hover:underline">
              Ver planes
            </PremiumCheckoutLink>
          </p>
        )}
      </div>
    </Card>
  )
}

export default ResultsPage
