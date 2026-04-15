import { redirect } from "next/navigation"

import { PracticeSessionClient } from "@/components/app/practice-session-client"
import { requireUser } from "@/lib/auth"
import { getRandomPracticeQuestion } from "@/lib/queries/app"
import { createClient } from "@/lib/supabase/server"
import { getUserPreferences } from "@/lib/user-preferences"
import { canAnswerPracticeQuestion } from "@/lib/usage"

interface PracticeSessionPageProps {
  searchParams: Promise<{ categoryId?: string }>
}

const PracticeSessionPage = async ({ searchParams }: PracticeSessionPageProps) => {
  const user = await requireUser()
  const supabase = await createClient()
  const prefs = await getUserPreferences(supabase, user.id)
  if (!prefs?.onboarding_completed) redirect("/onboarding")

  const { categoryId } = await searchParams
  const gate = await canAnswerPracticeQuestion(supabase, user.id)
  const initialQuestion = gate.ok ? await getRandomPracticeQuestion(categoryId) : null

  return (
    <PracticeSessionClient
      initialQuestion={initialQuestion}
      categoryId={categoryId}
      initialPracticeBlocked={!gate.ok}
    />
  )
}

export default PracticeSessionPage
