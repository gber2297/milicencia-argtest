import Link from "next/link"
import { redirect } from "next/navigation"

import { PremiumCheckoutLink } from "@/components/app/premium-links"
import { BookOpen, ClipboardCheck, Crosshair, Flame, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getProgressStats } from "@/lib/queries/app"
import { getUserPreferences } from "@/lib/user-preferences"
import { computeMasteryProgress, getUsageSummaryForClient } from "@/lib/usage"
import { formatPercentage } from "@/lib/utils"

const DashboardPage = async () => {
  const user = await requireUser()
  const supabase = await createClient()
  const prefs = await getUserPreferences(supabase, user.id)
  if (!prefs?.onboarding_completed) redirect("/onboarding")

  const stats = await getProgressStats(user.id)
  const usage = await getUsageSummaryForClient(supabase, user.id)
  const mastery = computeMasteryProgress({ accuracy: stats.accuracy, totalAnswered: stats.totalAnswered })

  const statItems = [
    {
      label: "Respondidas",
      value: String(stats.totalAnswered),
      icon: ClipboardCheck,
      accent: "from-blue-600 to-blue-700",
    },
    {
      label: "Precision",
      value: formatPercentage(stats.accuracy),
      icon: Crosshair,
      accent: "from-emerald-600 to-teal-600",
    },
    {
      label: "Examenes",
      value: String(stats.examsTaken),
      icon: BookOpen,
      accent: "from-violet-600 to-indigo-600",
    },
    {
      label: "Ultimo score",
      value: stats.lastExamScore ? formatPercentage(stats.lastExamScore) : "—",
      icon: Trophy,
      accent: "from-amber-500 to-orange-600",
    },
  ] as const

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Bienvenido a MiLicencia Argentina Test 🇦🇷</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
          Entrena rapido, mide progreso y detecta tus debilidades.
        </p>
      </div>

      <Card className="border-blue-100/80 bg-gradient-to-r from-blue-50/50 to-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-800/80">Camino a dominar el examen</p>
            <div className="mt-2 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all"
                style={{ width: `${mastery}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              Completado al <span className="font-semibold tabular-nums text-zinc-900">{mastery}%</span>
            </p>
          </div>
          {usage.streakCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-orange-200/80 bg-orange-50/80 px-3 py-2 text-sm font-medium text-orange-950">
              <Flame className="size-5 shrink-0 text-orange-600" aria-hidden />
              Llevás {usage.streakCount} {usage.streakCount === 1 ? "día" : "días"} seguidos practicando
            </div>
          )}
        </div>
        {!usage.isPremium && (
          <p className="mt-3 text-xs text-zinc-500">
            Plan gratis: {usage.practice.remaining ?? 0} preguntas de practica restantes hoy ·{" "}
            <PremiumCheckoutLink className="font-medium text-blue-700 hover:underline">
              Premium ilimitado
            </PremiumCheckoutLink>
          </p>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {statItems.map(({ label, value, icon: Icon, accent }) => (
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
        <Card className="flex flex-col gap-4 border-blue-100/80 bg-gradient-to-b from-white to-blue-50/30 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Practica diaria</h2>
            <p className="mt-1 text-sm text-zinc-600">Una pregunta a la vez con feedback inmediato.</p>
          </div>
          <Link href="/practice" className="mt-auto">
            <Button className="w-full sm:w-auto">Empezar practica</Button>
          </Link>
        </Card>
        <Card className="flex flex-col gap-4 border-indigo-100/80 bg-gradient-to-b from-white to-indigo-50/25 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Simulacro de examen</h2>
            <p className="mt-1 text-sm text-zinc-600">Serie completa al ritmo del examen.</p>
          </div>
          <Link href="/exam" className="mt-auto">
            <Button className="w-full sm:w-auto">Iniciar simulacro</Button>
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Areas a mejorar</h2>
          <p className="mt-1 text-sm text-zinc-600">Prioriza categorias con mas errores.</p>
          <Link href="/weak-areas" className="mt-4 inline-block">
            <Button variant="secondary">Ver analisis</Button>
          </Link>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Tu perfil</h2>
          <p className="mt-1 text-sm text-zinc-600">Datos de cuenta y preferencias.</p>
          <Link href="/profile" className="mt-4 inline-block">
            <Button variant="outline">Configurar perfil</Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
