import { NextResponse } from "next/server"

import { getExamQuestions } from "@/lib/queries/app"
import { createClient } from "@/lib/supabase/server"
import { canStartExam, recordExamStarted } from "@/lib/usage"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gate = await canStartExam(supabase, user.id)
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Se requiere suscripción activa", code: gate.reason },
      { status: 403 },
    )
  }

  const questions = await getExamQuestions(30)
  if (questions.length < 30) {
    return NextResponse.json(
      { error: "Se requieren al menos 30 preguntas activas para iniciar el simulacro" },
      { status: 400 },
    )
  }

  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .insert({ user_id: user.id, total_questions: questions.length })
    .select("id")
    .single()

  if (sessionError || !session) return NextResponse.json({ error: "No se pudo crear el examen" }, { status: 500 })

  const { error: relationError } = await supabase.from("exam_session_questions").insert(
    questions.map((question, index) => ({
      exam_session_id: session.id,
      question_id: question.id,
      order_index: index,
    })),
  )
  if (relationError) {
    return NextResponse.json({ error: "No se pudieron cargar las preguntas del examen" }, { status: 500 })
  }

  try {
    await recordExamStarted(supabase, user.id)
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el uso del simulacro" }, { status: 500 })
  }

  return NextResponse.json({ sessionId: session.id, questions })
}
