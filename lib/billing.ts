import type { SupabaseClient } from "@supabase/supabase-js"

export const PLAN_LIMITS = {
  freePracticePerDay: 15,
  freeExamPerDay: 1,
  weakAreasPreview: 2,
  progressCategoriesPreview: 3,
} as const

export interface SubscriptionRow {
  plan: string
  status: string
}

export function isPremiumSubscription(row: SubscriptionRow | null | undefined) {
  if (!row) return false
  return row.plan === "premium" && row.status === "active"
}

export async function getSubscriptionForUser(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from("subscriptions").select("plan, status").eq("user_id", userId).maybeSingle()
  return data as SubscriptionRow | null
}
