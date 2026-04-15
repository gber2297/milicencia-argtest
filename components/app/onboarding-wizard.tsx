"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Category } from "@/types/domain"
import { cn } from "@/lib/utils"

interface OnboardingWizardProps {
  categories: Pick<Category, "id" | "name" | "slug">[]
}

const GOALS = [
  { id: "approve_fast" as const, label: "Aprobar rápido" },
  { id: "daily_bit" as const, label: "Practicar un poco cada día" },
  { id: "find_mistakes" as const, label: "Ver en qué fallo" },
]

const EXPERIENCE = [
  { id: "failed_before" as const, label: "Sí, pero no aprobé" },
  { id: "first_time" as const, label: "No, es mi primera vez" },
  { id: "practicing" as const, label: "Estoy practicando" },
]

export function OnboardingWizard({ categories }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState<(typeof GOALS)[number]["id"] | null>(null)
  const [experienceLevel, setExperienceLevel] = useState<(typeof EXPERIENCE)[number]["id"] | null>(null)
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  async function submitAndGoPractice() {
    setSaving(true)
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          experienceLevel,
          weakCategorySlugs: selectedSlugs,
          onboardingCompleted: true,
        }),
      })
      router.push("/practice/session")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function skipAll() {
    setSaving(true)
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: null,
          experienceLevel: null,
          weakCategorySlugs: [],
          onboardingCompleted: true,
        }),
      })
      router.push("/practice/session")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex justify-center gap-1.5">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn("h-1.5 flex-1 max-w-16 rounded-full transition", s <= step ? "bg-blue-600" : "bg-zinc-200")}
          />
        ))}
      </div>

      {step === 1 && (
        <Card className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Paso 1 de 4</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Aprobá el examen a la primera</h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            Practicá con preguntas reales y detectá tus errores antes del día del examen.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-between">
            <button type="button" onClick={skipAll} className="text-sm text-zinc-500 underline-offset-4 hover:underline">
              Saltar personalización
            </button>
            <Button type="button" onClick={() => setStep(2)} className="w-full sm:w-auto">
              Empezar ahora
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Paso 2 de 4</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-900">¿Qué querés lograr?</h2>
          <div className="mt-5 space-y-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition",
                  goal === g.id
                    ? "border-blue-500 bg-blue-50/80 text-blue-950"
                    : "border-zinc-200 bg-white hover:border-zinc-300",
                )}
              >
                {g.label}
                {goal === g.id ? <Check className="size-5 text-blue-600" /> : null}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button type="button" onClick={() => setStep(3)} disabled={!goal}>
              Siguiente
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Paso 3 de 4</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-900">¿Ya hiciste el examen antes?</h2>
          <div className="mt-5 space-y-2">
            {EXPERIENCE.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setExperienceLevel(e.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition",
                  experienceLevel === e.id
                    ? "border-blue-500 bg-blue-50/80 text-blue-950"
                    : "border-zinc-200 bg-white hover:border-zinc-300",
                )}
              >
                {e.label}
                {experienceLevel === e.id ? <Check className="size-5 text-blue-600" /> : null}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Atrás
            </Button>
            <Button type="button" onClick={() => setStep(4)} disabled={!experienceLevel}>
              Siguiente
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Paso 4 de 4 · Opcional</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-900">¿Qué te cuesta más?</h2>
          <p className="mt-1 text-sm text-zinc-600">Elegí una o varias. Podés cambiar esto después.</p>
          {categories.length === 0 ? (
            <p className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
              No hay categorías cargadas en el sistema. En Supabase ejecutá el <code className="rounded bg-white/80 px-1">INSERT</code> de
              categorías de <code className="rounded bg-white/80 px-1">supabase/seed.sql</code> (inicio del archivo). Si ya importaste
              preguntas antes, corrés también{" "}
              <code className="rounded bg-white/80 px-1">node scripts/backfill-question-categories.mjs --apply=true</code>.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.slice(0, 12).map((c) => {
              const active = selectedSlugs.includes(c.slug)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleSlug(c.slug)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    active ? "border-blue-600 bg-blue-50 text-blue-900" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
                  )}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep(3)}>
              Atrás
            </Button>
            <Button type="button" disabled={saving} onClick={submitAndGoPractice} className="w-full sm:w-auto">
              {saving ? "Guardando…" : "Ver mi primera pregunta"}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
