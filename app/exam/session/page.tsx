import { redirect } from "next/navigation"

import { ExamSessionClient } from "@/components/app/exam-session-client"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getUserPreferences } from "@/lib/user-preferences"

const ExamSessionPage = async () => {
  const user = await requireUser()
  const supabase = await createClient()
  const prefs = await getUserPreferences(supabase, user.id)
  if (!prefs?.onboarding_completed) redirect("/onboarding")

  return <ExamSessionClient />
}

export default ExamSessionPage
