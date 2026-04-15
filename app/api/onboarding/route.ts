import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { upsertUserPreferences } from "@/lib/user-preferences"

const schema = z.object({
  goal: z.enum(["approve_fast", "daily_bit", "find_mistakes"]).nullable().optional(),
  experienceLevel: z.enum(["failed_before", "first_time", "practicing"]).nullable().optional(),
  weakCategorySlugs: z.array(z.string()).max(12).optional().default([]),
  onboardingCompleted: z.boolean().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalido" }, { status: 400 })
  }

  const { goal, experienceLevel, weakCategorySlugs, onboardingCompleted } = parsed.data

  const { error } = await upsertUserPreferences(supabase, user.id, {
    goal: goal ?? null,
    experience_level: experienceLevel ?? null,
    weak_category_slugs: weakCategorySlugs ?? [],
    onboarding_completed: onboardingCompleted ?? true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
