import type { Metadata } from "next"
import Link from "next/link"

import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Probar | Mi Licencia Argentina",
  description: "Creá tu cuenta y suscribite para practicar y hacer simulacros.",
}

export default function ProbarPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Practicá en Mi Licencia</h1>
        <p className="max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
          El modo práctica y el simulacro están disponibles con suscripción activa. Creá tu cuenta y elegí un plan para
          empezar.
        </p>
      </div>
      <Card className="landing-card-hover border-blue-100/80 bg-gradient-to-br from-blue-50/80 to-white p-6 sm:p-8">
        <p className="text-sm text-zinc-700">
          Si ya tenés cuenta, iniciá sesión y suscribite desde Precios. Si no, registrate y después elegí un plan.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:brightness-110"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200/90 bg-white/90 px-4 text-sm font-semibold text-zinc-800 shadow-sm hover:border-blue-200/80 hover:bg-blue-50/50"
          >
            Ingresar
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200/90 bg-white/90 px-4 text-sm font-semibold text-zinc-800 shadow-sm hover:border-blue-200/80 hover:bg-blue-50/50"
          >
            Ver planes
          </Link>
        </div>
      </Card>
    </div>
  )
}
