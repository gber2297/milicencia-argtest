import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } },
  )
}

/** Misma config que `createAdminClient`, o `null` si falta la service role (p. ej. CI sin secrets). */
export function tryCreateAdminClient(): SupabaseClient | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!serviceRoleKey || !url) return null
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } })
}
