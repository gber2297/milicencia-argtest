"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArrowRight,
  Car,
  Check,
  ChevronLeft,
  Layers,
  RefreshCw,
  Sparkles,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import type { Category } from "@/types/domain"
import { cn } from "@/lib/utils"

interface OnboardingWizardProps {
  categories: Pick<Category, "id" | "name" | "slug">[]
}

const WELCOME_HERO =
  "https://media.screensdesign.com/gasset/0b24766b-f55a-433f-b79c-9d933e838884.png"
const SOCIAL_AVATARS = [
  "https://media.screensdesign.com/gasset/d95cd629-b490-465c-8b5c-6fb481b8b2d0.png",
  "https://media.screensdesign.com/gasset/dc387d30-b085-453b-9db8-a08810c9f690.png",
  "https://media.screensdesign.com/gasset/9d352376-f2f5-4cd3-9666-38cc7c198f28.png",
] as const

const GOALS = [
  {
    id: "primera_licencia" as const,
    title: "Primera licencia",
    subtitle: "Nunca rendí el examen antes",
    Icon: Car,
  },
  {
    id: "renovacion" as const,
    title: "Renovación",
    subtitle: "Ya tengo pero necesito revalidar",
    Icon: RefreshCw,
  },
  {
    id: "cambio_categoria" as const,
    title: "Cambio de categoría",
    subtitle: "Profesional, moto o maquinaria",
    Icon: Layers,
  },
]

const EXPERIENCE = [
  {
    id: "cero" as const,
    emoji: "🐣",
    title: "Cero",
    subtitle: "No sé nada de señales todavía.",
  },
  {
    id: "algo_se" as const,
    emoji: "🚲",
    title: "Algo sé",
    subtitle: "Conozco lo básico por andar en bici o caminar.",
  },
  {
    id: "canchero" as const,
    emoji: "🚦",
    title: "Estoy canchero/a",
    subtitle: "Sé bastante, solo quiero repasar antes del examen.",
  },
]

function ProgressHeader({
  filled,
  onBack,
}: {
  filled: number
  onBack: () => void
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onBack}
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-zinc-900 transition hover:bg-zinc-100 active:bg-zinc-200"
        aria-label="Volver"
      >
        <ChevronLeft className="size-6" />
      </button>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 w-8 rounded-full transition",
              i < filled ? "bg-[var(--brand-blue)]" : "bg-zinc-200",
            )}
          />
        ))}
      </div>
      <div className="w-10 shrink-0" aria-hidden />
    </div>
  )
}

export function OnboardingWizard({ categories }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [goal, setGoal] = useState<(typeof GOALS)[number]["id"] | null>(null)
  const [experienceLevel, setExperienceLevel] = useState<(typeof EXPERIENCE)[number]["id"] | null>(null)
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function postOnboarding(body: {
    goal: typeof goal
    experienceLevel: typeof experienceLevel
    weakCategorySlugs: string[]
    onboardingCompleted: boolean
  }) {
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: body.goal,
        experienceLevel: body.experienceLevel,
        weakCategorySlugs: body.weakCategorySlugs,
        onboardingCompleted: body.onboardingCompleted,
      }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) throw new Error(data.error ?? "No se pudo guardar. Probá de nuevo.")
  }

  async function goToFirstQuestion() {
    setError(null)
    setSaving(true)
    try {
      await postOnboarding({
        goal,
        experienceLevel,
        weakCategorySlugs: selectedSlugs,
        onboardingCompleted: true,
      })
      router.push("/practice/session")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.")
    } finally {
      setSaving(false)
    }
  }

  async function skipToPractice() {
    setError(null)
    setSaving(true)
    try {
      await postOnboarding({
        goal: null,
        experienceLevel: null,
        weakCategorySlugs: [],
        onboardingCompleted: true,
      })
      router.push("/practice/session")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.")
    } finally {
      setSaving(false)
    }
  }

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))
  }

  const brandBtn =
    "inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] text-base font-bold text-white shadow-lg shadow-blue-200/80 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
  const outlineBtn =
    "h-14 w-full rounded-2xl border-2 border-transparent bg-white text-base font-semibold text-[var(--brand-blue)] transition hover:bg-zinc-50 active:opacity-80 disabled:opacity-60"

  return (
    <div className="mx-auto max-w-md">
      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {error}
        </p>
      ) : null}

      {/* Welcome */}
      {step === 1 && (
        <div className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-900/5">
          <div className="relative px-6 pt-12 pb-2">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-lg">
              <Image
                src={WELCOME_HERO}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 448px) 100vw, 448px"
                priority
              />
            </div>
          </div>
          <div className="px-8 pb-2 pt-4 text-center">
            <p className="mb-2 inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              <Sparkles className="size-3.5 text-amber-400" aria-hidden />
              MiLicencia
            </p>
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-zinc-900">
              Aprobá tu examen teórico en Argentina
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              Practicá con simulacros reales, recibí feedback al instante y obtené tu licencia a la primera.
            </p>
          </div>
          <div className="mt-10 flex items-center justify-center gap-2 px-6">
            <div className="flex -space-x-3">
              {SOCIAL_AVATARS.map((src) => (
                <Image
                  key={src}
                  src={src}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 rounded-full border-2 border-white object-cover"
                  sizes="32px"
                />
              ))}
            </div>
            <span className="text-sm font-medium text-zinc-500">+10.000 usuarios ya aprobaron</span>
          </div>
          <div className="flex flex-col gap-3 p-8">
            <button type="button" className={brandBtn} disabled={saving} onClick={() => setStep(2)}>
              Empezar ahora
            </button>
            <button type="button" className={outlineBtn} disabled={saving} onClick={skipToPractice}>
              {saving ? "Abriendo…" : "Probar una pregunta"}
            </button>
          </div>
        </div>
      )}

      {/* Goal */}
      {step === 2 && (
        <Card className="landing-card-hover border-white/90 p-6 shadow-xl shadow-blue-500/10 sm:p-8">
          <ProgressHeader filled={1} onBack={() => setStep(1)} />
          <h2 className="text-2xl font-bold text-zinc-900">¿Cuál es tu objetivo principal?</h2>
          <p className="mt-2 text-zinc-500">Personalizaremos tu estudio para que sea más eficiente.</p>
          <div className="mt-10 flex flex-col gap-4">
            {GOALS.map((g) => {
              const selected = goal === g.id
              const Icon = g.Icon
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition active:scale-[0.98]",
                    selected
                      ? "border-[var(--brand-blue)] bg-blue-50/90"
                      : "border-zinc-100 bg-white hover:border-zinc-200",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-xl text-white",
                      selected ? "bg-[var(--brand-blue)]" : "bg-zinc-100 text-zinc-400",
                    )}
                  >
                    <Icon className="size-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-zinc-900">{g.title}</p>
                    <p className="text-xs text-zinc-600">{g.subtitle}</p>
                  </div>
                  {selected ? <Check className="size-7 shrink-0 text-[var(--brand-blue)]" aria-hidden /> : null}
                </button>
              )
            })}
          </div>
          <div className="mt-10">
            <button
              type="button"
              className={brandBtn}
              disabled={!goal || saving}
              onClick={() => setStep(3)}
            >
              Continuar
            </button>
          </div>
        </Card>
      )}

      {/* Experience */}
      {step === 3 && (
        <Card className="landing-card-hover border-white/90 p-6 shadow-xl shadow-blue-500/10 sm:p-8">
          <ProgressHeader filled={2} onBack={() => setStep(2)} />
          <h2 className="text-2xl font-bold leading-snug text-zinc-900">¿Cuánto sabés sobre señales y normas?</h2>
          <p className="mt-2 text-zinc-500">Esto nos ayuda a elegir el nivel de dificultad inicial.</p>
          <div className="mt-10 flex flex-col gap-4">
            {EXPERIENCE.map((e) => {
              const selected = experienceLevel === e.id
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setExperienceLevel(e.id)}
                  className={cn(
                    "relative flex flex-col rounded-2xl border-2 p-6 text-left transition active:scale-[0.98]",
                    selected
                      ? "border-[var(--brand-blue)] bg-blue-50"
                      : "border-zinc-100 hover:border-zinc-200",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl" aria-hidden>
                      {e.emoji}
                    </span>
                    {selected ? (
                      <Check className="size-7 text-[var(--brand-blue)]" aria-hidden />
                    ) : (
                      <div className="size-6 rounded-full border-2 border-zinc-200" aria-hidden />
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-4 text-lg font-bold",
                      selected ? "text-[var(--brand-blue)]" : "text-zinc-900",
                    )}
                  >
                    {e.title}
                  </p>
                  <p className={cn("text-sm", selected ? "text-zinc-700" : "text-zinc-500")}>{e.subtitle}</p>
                </button>
              )
            })}
          </div>
          <div className="mt-10">
            <button
              type="button"
              className={brandBtn}
              disabled={!experienceLevel || saving}
              onClick={() => setStep(4)}
            >
              Continuar
            </button>
          </div>
        </Card>
      )}

      {/* Topics */}
      {step === 4 && (
        <Card className="landing-card-hover border-white/90 p-6 shadow-xl shadow-blue-500/10 sm:p-8">
          <ProgressHeader filled={3} onBack={() => setStep(3)} />
          <h2 className="text-2xl font-bold text-zinc-900">¿Qué temas te preocupan?</h2>
          <p className="mt-2 text-zinc-500">Podés seleccionar varios. Enfocaremos las preguntas ahí.</p>
          {categories.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
              Todavía no hay temas cargados. Podés finalizar igual: te mostraremos preguntas variadas.
            </p>
          ) : null}
          <div className="mt-10 flex flex-wrap gap-3">
            {categories.slice(0, 14).map((c) => {
              const active = selectedSlugs.includes(c.slug)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleSlug(c.slug)}
                  className={cn(
                    "rounded-full border-2 px-6 py-4 text-sm font-semibold transition active:scale-95",
                    active
                      ? "border-[var(--brand-blue)] bg-blue-50 text-[var(--brand-blue)]"
                      : "border-zinc-100 font-medium text-zinc-600 hover:border-zinc-200",
                  )}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
          <div className="mt-10">
            <button type="button" className={brandBtn} disabled={saving} onClick={goToFirstQuestion}>
              {saving ? "Guardando…" : (
                <>
                  Finalizar configuración
                  <ArrowRight className="size-5" aria-hidden />
                </>
              )}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
