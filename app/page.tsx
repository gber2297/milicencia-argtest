import Link from "next/link"
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="space-y-14 pb-12 sm:space-y-16 sm:pb-16">
      <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 px-6 py-12 text-white shadow-xl shadow-blue-950/20 sm:px-10 sm:py-14 md:px-12 md:py-16">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-sky-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-blue-400/15 blur-2xl"
          aria-hidden
        />
        <p className="relative mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90">
          <Sparkles className="size-3.5 text-amber-300/90" aria-hidden />
          MiLicencia Argentina Test 🇦🇷
        </p>
        <h1 className="relative max-w-2xl text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl md:leading-[1.1]">
          Practica el teorico de manejo y aproba mas rapido
        </h1>
        <p className="relative mt-4 max-w-lg text-base leading-relaxed text-blue-100/95 sm:text-lg">
          Simulacros realistas, feedback instantaneo y analisis de areas debiles para estudiar mejor.
        </p>
        <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link href="/register" className="inline-flex sm:shrink-0">
            <Button className="h-11 w-full bg-white px-6 text-blue-800 shadow-lg shadow-blue-950/25 hover:bg-blue-50 sm:w-auto">
              Empezar gratis
              <ArrowRight className="ml-2 size-4" aria-hidden />
            </Button>
          </Link>
          <Link href="/pricing" className="inline-flex sm:shrink-0">
            <Button
              variant="outline"
              className="h-11 w-full border-white/30 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 sm:w-auto"
            >
              Ver planes
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        <Card className="group border-zinc-200/80 p-5 transition hover:border-blue-200/80 hover:shadow-md sm:p-6">
          <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-600/25">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <h2 className="font-semibold text-zinc-900">Preguntas por categoria</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">Contenido alineado al examen teorico local.</p>
        </Card>
        <Card className="group border-zinc-200/80 p-5 transition hover:border-blue-200/80 hover:shadow-md sm:p-6">
          <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-blue-600 text-white shadow-sm shadow-sky-600/20">
            <Timer className="size-5" aria-hidden />
          </div>
          <h2 className="font-semibold text-zinc-900">Simulacros de 30 preguntas</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">Ritmo similar al examen real.</p>
        </Card>
        <Card className="group border-zinc-200/80 p-5 transition hover:border-blue-200/80 hover:shadow-md sm:col-span-2 lg:col-span-1 sm:p-6">
          <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20">
            <CheckCircle2 className="size-5" aria-hidden />
          </div>
          <h2 className="font-semibold text-zinc-900">Correccion y explicaciones</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">En practica ves el feedback al instante.</p>
        </Card>
      </section>

      <section className="grid gap-5 md:grid-cols-2 md:gap-6">
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Como funciona</h2>
          <ol className="mt-4 space-y-3 text-sm text-zinc-600">
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                1
              </span>
              <span className="pt-0.5 leading-relaxed">Elegis practica o simulacro.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                2
              </span>
              <span className="pt-0.5 leading-relaxed">Respondes preguntas en minutos.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                3
              </span>
              <span className="pt-0.5 leading-relaxed">Revisas errores y areas a mejorar.</span>
            </li>
          </ol>
        </Card>
        <Card className="border-dashed border-zinc-300/80 bg-zinc-50/50 p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">FAQ</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-600">
            <p>Pensado para el examen teorico local de Argentina.</p>
            <p>Funciona bien en celular, tablet y escritorio.</p>
          </div>
        </Card>
      </section>
    </div>
  )
}
