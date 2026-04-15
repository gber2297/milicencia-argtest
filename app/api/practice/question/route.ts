import { NextResponse } from "next/server"

import { getRandomPracticeQuestion } from "@/lib/queries/app"
import { createClient } from "@/lib/supabase/server"
import { canAnswerPracticeQuestion, getUsageSummaryForClient } from "@/lib/usage"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gate = await canAnswerPracticeQuestion(supabase, user.id)
  if (!gate.ok) {
    const summary = await getUsageSummaryForClient(supabase, user.id)
    return NextResponse.json(
      { error: "LIMIT_PRACTICE", code: gate.reason, usage: summary },
      { status: 403 },
    )
  }

  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get("categoryId") ?? undefined
  const question = await getRandomPracticeQuestion(categoryId)

  if (!question) return NextResponse.json({ error: "No hay preguntas disponibles" }, { status: 404 })

  const summary = await getUsageSummaryForClient(supabase, user.id)
  return NextResponse.json({ question, usage: summary })
}
