import Link from "next/link"
import { redirect } from "next/navigation"
import { Zap } from "lucide-react"

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
    <Card className="border-blue-100/80 bg-gradient-to-b from-white to-blue-50/25 p-6 sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-600/20">
        <Zap className="size-6" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">Modo practica</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base">
        Respuesta inmediata con explicacion para aprender mas rapido.
      </p>
      <Link href="/practice/session" className="mt-6 inline-block">
        <Button className="min-w-[200px]">Comenzar ahora</Button>
      </Link>
    </Card>
  )
}

export default PracticePage
