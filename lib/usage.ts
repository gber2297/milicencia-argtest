import type { SupabaseClient } from "@supabase/supabase-js"

import { getSubscriptionForUser, isPremiumSubscription } from "@/lib/billing"
import { getUserPreferences } from "@/lib/user-preferences"

function utcTodayString() {
  return new Date().toISOString().slice(0, 10)
}

export async function getTodayUsageRow(supabase: SupabaseClient, userId: string) {
  const day = utcTodayString()
  const { data } = await supabase
    .from("user_usage")
    .select("questions_answered, exams_started")
    .eq("user_id", userId)
    .eq("usage_date", day)
    .maybeSingle()
  return {
    questions_answered: data?.questions_answered ?? 0,
    exams_started: data?.exams_started ?? 0,
  }
}

export async function getUsageSummaryForClient(supabase: SupabaseClient, userId: string) {
  const sub = await getSubscriptionForUser(supabase, userId)
  const premium = isPremiumSubscription(sub)
  const usage = await getTodayUsageRow(supabase, userId)
  const prefs = await getUserPreferences(supabase, userId)

  const practiceUsed = usage.questions_answered
  const examUsed = usage.exams_started

  return {
    isPremium: premium,
    onboardingCompleted: prefs?.onboarding_completed ?? false,
    streakCount: prefs?.streak_count ?? 0,
    practice: {
      used: practiceUsed,
      limit: premium ? null : 0,
      remaining: premium ? null : 0,
    },
    exam: {
      used: examUsed,
      limit: premium ? null : 0,
      remaining: premium ? null : 0,
    },
  }
}

export async function canAnswerPracticeQuestion(supabase: SupabaseClient, userId: string) {
  const sub = await getSubscriptionForUser(supabase, userId)
  if (isPremiumSubscription(sub)) return { ok: true as const, reason: null as string | null }
  return { ok: false as const, reason: "SUBSCRIPTION_REQUIRED" as const }
}

export async function canStartExam(supabase: SupabaseClient, userId: string) {
  const sub = await getSubscriptionForUser(supabase, userId)
  if (isPremiumSubscription(sub)) return { ok: true as const, reason: null as string | null }
  return { ok: false as const, reason: "SUBSCRIPTION_REQUIRED" as const }
}

export async function recordPracticeAnswer(supabase: SupabaseClient, userId: string) {
  const sub = await getSubscriptionForUser(supabase, userId)
  if (!isPremiumSubscription(sub)) {
    throw new Error("Se requiere suscripción activa")
  }
  await updateStreak(supabase, userId)
}

export async function recordExamStarted(supabase: SupabaseClient, userId: string) {
  const sub = await getSubscriptionForUser(supabase, userId)
  if (!isPremiumSubscription(sub)) {
    throw new Error("Se requiere suscripción activa")
  }
}

async function updateStreak(supabase: SupabaseClient, userId: string) {
  const prefs = await getUserPreferences(supabase, userId)
  const today = utcTodayString()
  const last = prefs?.last_practice_date ?? null
  let streak = prefs?.streak_count ?? 0

  if (last === today) return

  if (!last) streak = 1
  else {
    const lastDate = new Date(`${last}T12:00:00Z`)
    const todayDate = new Date(`${today}T12:00:00Z`)
    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) streak += 1
    else streak = 1
  }

  await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      streak_count: streak,
      last_practice_date: today,
    },
    { onConflict: "user_id" },
  )
}

/** Mastery % toward exam readiness (heuristic, 0–100). */
export function computeMasteryProgress(input: { accuracy: number; totalAnswered: number }) {
  const acc = Math.min(100, Math.max(0, input.accuracy))
  const volume = Math.min(1, input.totalAnswered / 120)
  return Math.min(100, Math.round(acc * 0.65 + volume * 35))
}

export function pickAnswerFeedbackCopy(input: { isCorrect: boolean; difficulty: string }) {
  if (input.isCorrect) {
    const lines = [
      "Bien, esta es clave en el examen.",
      "Correcto — segui asi.",
      "Excelente, vas encaminado.",
    ]
    return lines[Math.floor(Math.random() * lines.length)]
  }
  if (input.difficulty === "hard") {
    return "Muchos fallan esta pregunta — revisa la explicacion."
  }
  return "No pasa nada — asi se aprende. Revisa la explicacion."
}
