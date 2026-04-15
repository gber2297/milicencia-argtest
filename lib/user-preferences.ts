import type { SupabaseClient } from "@supabase/supabase-js"

export interface UserPreferencesRow {
  user_id: string
  goal: string | null
  experience_level: string | null
  weak_category_slugs: string[] | null
  onboarding_completed: boolean
  streak_count: number
  last_practice_date: string | null
}

export async function getUserPreferences(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle()
  return data as UserPreferencesRow | null
}

export async function upsertUserPreferences(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<
    Pick<UserPreferencesRow, "goal" | "experience_level" | "weak_category_slugs" | "onboarding_completed">
  >,
) {
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      ...patch,
    },
    { onConflict: "user_id" },
  )
  return { error }
}
