import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Layers,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react"

import { FaqAccordion } from "@/components/landing/faq-accordion"
import { Card } from "@/components/ui/card"
import { getWeeklyCheckoutHref, isExternalCheckoutUrl } from "@/lib/checkout"
import { createClient } from "@/lib/supabase/server"
import { getUserPreferences } from "@/lib/user-preferences"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "MiLicencia Argentina 🇦🇷 | Examen teórico de manejo",
  description:
    "Practicá el teórico con preguntas tipo examen, simulacros de 30 preguntas y seguimiento de tu progreso. Pensado para Argentina.",
}

const FAQ_ITEMS = [
  {
    q: "¿Qué incluye la suscripción?",
    a: "Acceso completo a práctica y simulacros según tu plan, estadísticas por categoría, seguimiento de áreas a reforzar y actualizaciones del banco de preguntas.",
  },
  {
    q: "¿Cuál es la diferencia entre el plan semanal y el mensual?",
    a: "El plan semanal es ideal para una preparación intensa de corto plazo. El plan mensual ofrece mejor precio por día si vas a estudiar durante varias semanas.",
  },
  {
    q: "¿Sirve para el examen teórico de Argentina?",
    a: "Sí. El contenido está pensado para el teórico local: practicás por categorías y con simulacros tipo examen.",
  },
  {
    q: "¿Puedo usarlo en el celular?",
    a: "Sí. Es una web responsive: funciona en el navegador en celular, tablet y computadora.",
  },
  {
    q: "¿Cómo me suscribo?",
    a: "Elegí plan semanal o mensual, creá tu cuenta y completá el pago. Te guiamos desde la página de precios.",
  },
  {
    q: "¿Puedo cancelar la renovación?",
    a: "Podés gestionar la renovación desde tu cuenta o según la política del medio de pago que uses. Si tenés dudas, contactanos por email.",
  },
  {
    q: "¿Las preguntas se actualizan?",
    a: "Trabajamos para mantener el banco alineado a los temas del examen. Las mejoras se aplican de forma continua.",
  },
  {
    q: "¿Necesito instalar una app?",
    a: "No. Todo funciona en el navegador; podés practicar en cualquier dispositivo.",
  },
]

const TESTIMONIOS = [
  {
    name: "Valentina",
    place: "Córdoba",
    text: "Los simulacros me dieron confianza para el día del examen. Ver el progreso por tema me ayudó a enfocar lo que más me costaba.",
  },
  {
    name: "Martín",
    place: "Buenos Aires",
    text: "Practiqué en el celular en los viajes en colectivo. La interfaz es clara y las explicaciones cuando me equivocaba me cerraron el tema.",
  },
  {
    name: "Lucía",
    place: "Rosario",
    text: "Pasé a la primera. Me gustó poder repetir simulacros y ver estadísticas de dónde fallaba más.",
  },
] as const

function LandingSection({
  children,
  className,
  innerClassName,
  id,
}: {
  children: ReactNode
  className?: string
  innerClassName?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        "flex min-h-[calc(100dvh-var(--landing-nav-offset))] w-full snap-start snap-always scroll-mt-20 flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-12",
        className,
      )}
    >
      <div className={cn("flex w-full flex-col items-center justify-center", innerClassName)}>{children}</div>
    </section>
  )
}

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const prefs = await getUserPreferences(supabase, user.id)
    if (!prefs?.onboarding_completed) redirect("/onboarding")
    redirect("/dashboard")
  }

  const weeklyCheckoutHref = getWeeklyCheckoutHref()
  const weeklyCheckoutExternal = isExternalCheckoutUrl(weeklyCheckoutHref)

  return (
    <div className="landing-fullpage -mt-6 sm:-mt-8">
      <LandingSection className="py-4 sm:py-6" innerClassName="max-w-7xl gap-8 sm:gap-10">
        <div className="flex justify-center md:justify-start">
          <p className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-white/70 bg-white/60 px-6 py-3 text-center text-sm text-zinc-600 shadow-lg shadow-blue-500/5 backdrop-blur-md md:text-left">
            <span className="font-semibold text-zinc-800">Argentina · examen teórico</span>
            <span className="hidden text-zinc-300 sm:inline" aria-hidden>
              ·
            </span>
            <span>Práctica + simulacros + métricas</span>
          </p>
        </div>

        <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-sky-100/95 via-white to-violet-100/90 px-6 py-12 shadow-2xl shadow-blue-500/15 sm:px-10 sm:py-16 md:px-14 md:py-20">
          <div
            className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-cyan-300/40 blur-3xl animate-landing-glow"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full bg-violet-400/30 blur-3xl animate-landing-glow"
            style={{ animationDelay: "1.5s" }}
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col items-start space-y-8 text-left">
              <h1 className="w-full text-balance text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl md:leading-[1.08]">
                Aprobá el examen teórico con práctica guiada
              </h1>
              <p className="max-w-xl text-left text-lg leading-relaxed text-zinc-600 md:text-xl md:leading-relaxed">
                Preguntas tipo examen, simulacros de 30 preguntas, corrección al instante y seguimiento de tus temas más
                débiles — todo en una web pensada para Argentina.
              </p>
              <div className="flex w-full max-w-md flex-col items-stretch justify-start gap-4 sm:max-w-none sm:flex-row sm:flex-wrap">
                <Link
                  href="/register"
                  className="landing-btn-primary inline-flex h-14 min-w-[min(100%,280px)] items-center justify-center gap-2 rounded-2xl px-8 text-base font-bold text-white sm:min-w-0"
                >
                  Comenzar
                  <ArrowRight className="size-5 shrink-0" aria-hidden />
                </Link>
                <Link
                  href="/#planes"
                  className="landing-btn-secondary inline-flex h-14 min-w-[min(100%,240px)] items-center justify-center rounded-2xl px-8 text-base font-bold text-zinc-800 sm:min-w-0"
                >
                  Ver planes
                </Link>
              </div>
              <p className="text-left text-sm leading-relaxed text-zinc-500 md:text-base">
                <Link href="/pricing" className="font-semibold text-[var(--brand-blue)] underline-offset-4 hover:underline">
                  Plan semanal y mensual
                </Link>
                {" · "}
                <Link href="/login" className="font-medium text-zinc-600 underline-offset-4 hover:underline">
                  Ya tengo cuenta
                </Link>
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-md justify-self-center">
              <div
                className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-[2rem] bg-gradient-to-tr from-cyan-400/25 via-blue-500/20 to-fuchsia-500/25 blur-2xl"
                aria-hidden
              />
              <Card className="animate-landing-float relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-2xl shadow-blue-900/10 backdrop-blur-sm">
                <div className="border-b border-zinc-100/90 bg-gradient-to-r from-blue-50/90 to-violet-50/80 px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Simulacro · 30 preguntas
                </div>
                <div className="space-y-5 p-6 sm:p-8">
                  <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                    <span className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-blue-600/25">
                      Señalización
                    </span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">Medio</span>
                  </div>
                  <p className="text-center text-base font-medium leading-snug text-zinc-900 md:text-left">
                    En una encrucijada sin señalización, ¿quién tiene prioridad de paso?
                  </p>
                  <div className="space-y-2.5">
                    {["El que viene de la derecha", "El vehículo más grande", "El que llegó primero"].map((t, i) => (
                      <div
                        key={t}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-sm transition-colors duration-300",
                          i === 0
                            ? "border-emerald-300/80 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-950 shadow-sm shadow-emerald-500/10"
                            : "border-zinc-200/90 bg-white text-zinc-700",
                        )}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs text-zinc-400 md:text-left">Vista ilustrativa</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="caracteristicas" className="bg-white/40" innerClassName="max-w-7xl gap-12 lg:gap-14">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Todo lo que necesitás para el teórico, sin ruido
          </h2>
          <p className="text-lg leading-relaxed text-zinc-600 md:text-xl">
            Práctica real, feedback claro y métricas para saber en qué enfocarte.
          </p>
        </div>

        <div className="grid w-full justify-items-stretch gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3 lg:gap-12">
          <FeatureCard
            icon={<Timer className="size-7" />}
            accent="from-blue-600 to-indigo-600"
            title="Práctica y simulacros"
            subtitle="Entrená el ritmo del examen con series completas y seguimiento de tiempo."
            bullets={[
              "Práctica por tema o al azar",
              "Simulacros de 30 preguntas como en el examen",
              "Sin límites artificiales cuando estás suscripto",
            ]}
          />
          <FeatureCard
            icon={<Zap className="size-7" />}
            accent="from-amber-400 to-orange-600"
            title="Feedback al instante"
            subtitle="En cada respuesta sabés si ibas bien y leés la explicación cuando la hay."
            bullets={[
              "Corrección inmediata en modo práctica",
              "Explicaciones cuando la pregunta las incluye",
              "Aprendés del error en el momento",
            ]}
          />
          <FeatureCard
            icon={<BarChart3 className="size-7" />}
            accent="from-emerald-500 to-teal-600"
            title="Progreso y temas"
            subtitle="Seguimiento por categorías y áreas a reforzar."
            bullets={[
              "Dashboard con respuestas y precisión",
              "Análisis de áreas más débiles",
              "Evolución para estudiar con método",
            ]}
          />
          <FeatureCard
            icon={<Layers className="size-7" />}
            accent="from-violet-600 to-fuchsia-600"
            title="Preguntas por tema"
            subtitle="Contenido organizado por categorías alineadas al teórico local."
            bullets={["Practicá por categoría o al azar", "Onboarding para marcar temas", "Reforzá lo que más te cuesta"]}
          />
          <FeatureCard
            icon={<BookOpen className="size-7" />}
            accent="from-sky-500 to-blue-600"
            title="100% web"
            subtitle="Estudiá desde el navegador, sin instalar otra app."
            bullets={["Celular, tablet y escritorio", "Una cuenta para todo tu progreso", "Práctica, simulacro y resultados juntos"]}
          />
          <FeatureCard
            icon={<Sparkles className="size-7" />}
            accent="from-cyan-500 to-blue-700"
            title="Experiencia clara"
            subtitle="Interfaz simple para ir directo a practicar y ver resultados."
            bullets={["Flujo rápido a la primera pregunta", "Diseño pensado para concentrarte", "Pagos y planes transparentes"]}
          />
        </div>
      </LandingSection>

      <LandingSection innerClassName="max-w-6xl gap-10 lg:gap-12">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          Por qué no es “solo leer el manual”
        </h2>
        <div className="grid w-full gap-8 md:grid-cols-2 md:gap-10">
          <Card className="rounded-3xl border-rose-200/80 bg-gradient-to-br from-rose-50/90 to-orange-50/40 p-8 shadow-lg shadow-rose-500/5 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-rose-700/90">Sin práctica estructurada</p>
            <ul className="mt-8 space-y-4 text-base text-zinc-700">
              {[
                "Leer sin medir si entendiste",
                "Sin simulacro con formato de examen",
                "Dudas sin corregir hasta el día del test",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="text-rose-500" aria-hidden>
                    ✕
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="rounded-3xl border-blue-200/80 bg-gradient-to-br from-blue-50/95 to-indigo-50/60 p-8 shadow-lg shadow-blue-500/10 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-800">Con Mi Licencia</p>
            <ul className="mt-8 space-y-4 text-base text-zinc-800">
              {[
                "Practicás con ítems tipo examen",
                "Simulacro de 30 preguntas para el ritmo",
                "Corrección y seguimiento con método",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <Check className="mt-1 size-5 shrink-0 text-blue-600" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </LandingSection>

      <LandingSection id="planes" className="bg-gradient-to-b from-white/50 to-blue-50/30" innerClassName="max-w-6xl gap-10 lg:gap-12">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">Planes simples y claros</h2>
          <p className="text-lg text-zinc-600 md:text-xl">
            Elegí el ritmo que mejor te quede: una semana intensa o un mes completo de práctica.
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          <Card className="landing-card-hover rounded-3xl border-2 border-blue-200/80 bg-gradient-to-br from-blue-50/95 to-white p-8 shadow-xl sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Plan semanal</p>
            <h3 className="mt-2 text-xl font-bold text-zinc-900">Preparación intensa</h3>
            <p className="mt-4 text-4xl font-extrabold text-zinc-900">
              $4.990<span className="text-xl font-semibold text-zinc-500">/semana</span>
            </p>
            <p className="mt-1 text-sm text-zinc-500">Renovación semanal según términos de pago</p>
            <ul className="mt-8 space-y-3 text-base text-zinc-700">
              <li className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden />
                Práctica y simulacros ilimitados durante el período
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden />
                Estadísticas y áreas débiles completas
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden />
                Ideal si tenés examen en poco tiempo
              </li>
            </ul>
            <Link
              href={weeklyCheckoutHref}
              target={weeklyCheckoutExternal ? "_blank" : undefined}
              rel={weeklyCheckoutExternal ? "noopener noreferrer" : undefined}
              className="mt-10 block"
            >
              <span className="landing-btn-primary flex h-14 w-full items-center justify-center rounded-2xl text-base font-bold text-white">
                Elegir plan semanal
              </span>
            </Link>
            <p className="mt-3 text-center text-sm leading-snug text-zinc-600 md:text-left">
              Ingresá al link, elegí cómo pagar, ¡y listo!
            </p>
          </Card>
          <Card className="landing-card-hover rounded-3xl border-2 border-amber-300/60 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/80 p-8 shadow-xl shadow-amber-500/10 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-800">Más popular</p>
            <h3 className="mt-2 text-xl font-bold text-zinc-900">Plan mensual</h3>
            <p className="mt-4 text-4xl font-extrabold text-zinc-900">
              $8.990<span className="text-xl font-semibold text-zinc-500">/mes</span>
            </p>
            <p className="mt-1 text-sm text-zinc-500">Mejor precio por día si estudiás varias semanas</p>
            <ul className="mt-8 space-y-3 text-base text-zinc-700">
              <li className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
                Todo lo del plan semanal, por 30 días
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
                Tiempo para repasar sin apuro
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
                Renovación mensual
              </li>
            </ul>
            <Link href="/pricing" className="mt-10 block">
              <span className="landing-btn-amber flex h-14 w-full items-center justify-center rounded-2xl text-base font-bold text-white shadow-lg">
                Elegir plan mensual
              </span>
            </Link>
          </Card>
        </div>
      </LandingSection>

      <LandingSection innerClassName="max-w-6xl gap-10 lg:gap-14">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">Lo que dicen quienes practican</h2>
          <p className="text-lg text-zinc-600">Experiencias de ejemplo; los resultados dependen de tu dedicación.</p>
        </div>
        <div className="grid w-full gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {TESTIMONIOS.map((t) => (
            <Card
              key={t.name}
              className="rounded-3xl border-zinc-200/90 bg-white/90 p-8 shadow-lg backdrop-blur-sm sm:p-9"
            >
              <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
              <p className="text-xs text-zinc-500">{t.place}</p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">“{t.text}”</p>
            </Card>
          ))}
        </div>
      </LandingSection>

      <LandingSection id="faq" className="pb-20 sm:pb-24" innerClassName="max-w-3xl gap-10 lg:gap-12">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          Preguntas frecuentes
        </h2>
        <FaqAccordion items={FAQ_ITEMS} />
      </LandingSection>
    </div>
  )
}

function FeatureCard({
  icon,
  accent,
  title,
  subtitle,
  bullets,
}: {
  icon: ReactNode
  accent: string
  title: string
  subtitle: string
  bullets: string[]
}) {
  return (
    <Card className="landing-card-hover flex h-full flex-col rounded-3xl border border-white/80 bg-white/85 p-8 shadow-lg shadow-zinc-900/5 backdrop-blur-sm sm:p-10">
      <div
        className={cn(
          "mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
          accent,
        )}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
      <p className="mt-3 text-base leading-relaxed text-zinc-600">{subtitle}</p>
      <ul className="mt-6 space-y-3 border-t border-zinc-100/90 pt-6 text-sm leading-relaxed text-zinc-700">
        {bullets.map((b) => (
          <li key={b} className="flex gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-blue)]" aria-hidden />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
