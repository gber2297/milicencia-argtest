import Link from "next/link"
import { redirect } from "next/navigation"
import { Zap } from "lucide-react"

import { AppPageHeader } from "@/components/app/app-page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getUserPreferences } from "@/lib/user-preferences"

const PracticePage = async () => {
  const user = await requireUser()
  const supabase = await createClient()
  const prefs = await getUserPreferences(supabase, user.id)
  if (!prefs?.onboarding_completed) redirect("/onboarding")

  return (
    <div className="space-y-8">
      <AppPageHeader
        eyebrow="Entrenamiento"
        title="Modo práctica"
        description="Respuesta inmediata y explicación cuando aplica — para aprender más rápido."
      />
      <Card className="landing-card-hover relative overflow-hidden border-blue-200/40 bg-gradient-to-br from-sky-50/80 via-white to-blue-50/40 p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-cyan-300/40 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
            <Zap className="size-7" aria-hidden />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-zinc-600 sm:text-base">
            Elegí tema o dejá que el sistema mezcle preguntas. Ideal para corregir sobre la marcha.
          </p>
          <Link href="/practice/session" className="mt-8 inline-block">
            <Button className="min-w-[220px] px-8">Comenzar ahora</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default PracticePage
