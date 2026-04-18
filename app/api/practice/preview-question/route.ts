import { NextResponse } from "next/server"

import { getRandomPracticeQuestion } from "@/lib/queries/app"

/** Pregunta aleatoria sin cuenta (solo lectura vía RLS). No consume cupo de práctica. */
export async function GET() {
  const question = await getRandomPracticeQuestion()
  if (!question) return NextResponse.json({ error: "No hay preguntas disponibles" }, { status: 404 })
  return NextResponse.json({ question })
}
