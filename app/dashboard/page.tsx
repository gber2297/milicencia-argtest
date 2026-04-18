import Link from "next/link"
import { redirect } from "next/navigation"

import { ArgentinaFlagEmoji } from "@/components/app/argentina-flag-emoji"
import { AppPageHeader } from "@/components/app/app-page-header"
import { PremiumCheckoutLink } from "@/components/app/premium-links"
import { BookOpen, ClipboardCheck, ClipboardList, Crosshair, Flame, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getProgressStats } from "@/lib/queries/app"
import { getUserPreferences } from "@/lib/user-preferences"
import { computeMasteryProgress, getUsageSummaryForClient } from "@/lib/usage"
import { cn, formatPercentage } from "@/lib/utils"

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
      accent: "from-blue-600 to-indigo-600",
    },
    {
      label: "Precisión",
      value: formatPercentage(stats.accuracy),
      icon: Crosshair,
      accent: "from-emerald-500 to-teal-600",
    },
    {
      label: "Exámenes",
      value: String(stats.examsTaken),
      icon: BookOpen,
      accent: "from-violet-600 to-indigo-600",
    },
    {
      label: "Último score",
      value: stats.lastExamScore ? formatPercentage(stats.lastExamScore) : "—",
      icon: Trophy,
      accent: "from-amber-500 to-orange-600",
    },
  ] as const

  return (
    <div className="space-y-8 sm:space-y-10">
      <AppPageHeader
        eyebrow="Tu panel"
        title={
          <>
            Bienvenido a Mi Licencia <ArgentinaFlagEmoji className="align-middle" />
          </>
        }
        description="Entrená rápido, medí progreso y detectá qué temas reforzar antes del examen."
      />

      <Card className="landing-card-hover relative overflow-hidden border-blue-200/40 bg-gradient-to-br from-blue-50/90 via-white to-sky-50/50 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-cyan-300/25 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-800/90">Camino al examen</p>
            <div className="mt-3 h-3 w-full max-w-md overflow-hidden rounded-full bg-white/80 shadow-inner shadow-blue-500/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--landing-cyan)] via-[var(--brand-blue)] to-[var(--landing-violet)] transition-all duration-500"
                style={{ width: `${mastery}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-zinc-600">
              Completado al <span className="font-bold tabular-nums text-zinc-900">{mastery}%</span>
            </p>
          </div>
          {usage.streakCount > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-amber-50/80 px-4 py-2.5 text-sm font-semibold text-orange-950 shadow-sm shadow-orange-500/10">
              <Flame className="size-5 shrink-0 text-orange-500" aria-hidden />
              {usage.streakCount} {usage.streakCount === 1 ? "día" : "días"} seguidos
            </div>
          )}
        </div>
        {!usage.isPremium && (
          <p className="relative mt-4 border-t border-blue-100/80 pt-4 text-xs text-zinc-600">
            Sin suscripción activa no podés practicar ni hacer simulacros.{" "}
            <PremiumCheckoutLink choosePlanFirst className="font-semibold text-[var(--brand-blue)] hover:underline">
              Ver planes y suscribirme
            </PremiumCheckoutLink>
          </p>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {statItems.map(({ label, value, icon: Icon, accent }) => (
          <Card
            key={label}
            className="landing-card-hover group border-white/90 p-5 transition hover:border-blue-200/60"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-zinc-900">{value}</p>
              </div>
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                  accent,
                )}
              >
                <Icon className="size-5" aria-hidden />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="landing-card-hover flex flex-col gap-5 overflow-hidden border-blue-200/35 bg-gradient-to-br from-white via-blue-50/40 to-sky-50/30 p-6 sm:p-7">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
            <BookOpen className="size-6" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Práctica diaria</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">Una pregunta a la vez, con feedback al instante.</p>
          </div>
          <Link href="/practice" className="mt-auto">
            <Button className="w-full sm:w-auto">Empezar práctica</Button>
          </Link>
        </Card>
        <Card className="landing-card-hover flex flex-col gap-5 overflow-hidden border-violet-200/35 bg-gradient-to-br from-white via-violet-50/35 to-indigo-50/25 p-6 sm:p-7">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/25">
            <ClipboardList className="size-6" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Simulacro</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">Serie completa al ritmo del examen real.</p>
          </div>
          <Link href="/exam" className="mt-auto">
            <Button className="w-full sm:w-auto">Iniciar simulacro</Button>
          </Link>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="landing-card-hover border-zinc-200/60 p-6 sm:p-7">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Áreas a mejorar</h2>
          <p className="mt-1 text-sm text-zinc-600">Priorizá categorías con más errores.</p>
          <Link href="/weak-areas" className="mt-6 inline-block">
            <Button variant="secondary">Ver análisis</Button>
          </Link>
        </Card>
        <Card className="landing-card-hover border-zinc-200/60 p-6 sm:p-7">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Tu perfil</h2>
          <p className="mt-1 text-sm text-zinc-600">Datos de cuenta y preferencias.</p>
          <Link href="/profile" className="mt-6 inline-block">
            <Button variant="outline">Configurar perfil</Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
