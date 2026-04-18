import Link from "next/link"
import { redirect } from "next/navigation"
import { ClipboardList } from "lucide-react"

import { AppPageHeader } from "@/components/app/app-page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getUserPreferences } from "@/lib/user-preferences"

const ExamPage = async () => {
  const user = await requireUser()
  const supabase = await createClient()
  const prefs = await getUserPreferences(supabase, user.id)
  if (!prefs?.onboarding_completed) redirect("/onboarding")

  return (
    <div className="space-y-8">
      <AppPageHeader
        eyebrow="Examen"
        title="Simulacro"
        description="30 preguntas, sin explicaciones hasta el final — como en el teórico real."
      />
      <Card className="landing-card-hover relative overflow-hidden border-indigo-200/40 bg-gradient-to-br from-violet-50/70 via-white to-indigo-50/35 p-8 sm:p-10">
        <div className="pointer-events-none absolute -left-10 -bottom-10 size-40 rounded-full bg-violet-400/30 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/30">
            <ClipboardList className="size-7" aria-hidden />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-zinc-600 sm:text-base">
            Cronómetro y resultado al cierre. Usalo para medir si estás listo para rendir.
          </p>
          <Link href="/exam/session" className="mt-8 inline-block">
            <Button className="min-w-[220px] px-8">Iniciar examen</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default ExamPage
