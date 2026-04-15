import Link from "next/link"
import { redirect } from "next/navigation"
import { ClipboardList } from "lucide-react"

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
    <Card className="border-indigo-100/80 bg-gradient-to-b from-white to-indigo-50/20 p-6 sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-sm shadow-indigo-600/20">
        <ClipboardList className="size-6" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">Simulacro de examen</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base">
        30 preguntas, sin explicaciones hasta finalizar.
      </p>
      <Link href="/exam/session" className="mt-6 inline-block">
        <Button className="min-w-[200px]">Iniciar examen</Button>
      </Link>
    </Card>
  )
}

export default ExamPage
