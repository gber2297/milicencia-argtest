import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/** Vercel a veces guarda el valor con comillas envolventes; rompe el JWT. */
function normalizeSecret(raw: string | undefined) {
  if (!raw) return ""
  let s = raw.trim()
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim()
  }
  return s
}

export function createAdminClient() {
  const serviceRoleKey = normalizeSecret(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), serviceRoleKey, {
    auth: { persistSession: false },
  })
}

/** Misma config que `createAdminClient`, o `null` si falta la service role (p. ej. CI sin secrets). */
export function tryCreateAdminClient(): SupabaseClient | null {
  const serviceRoleKey = normalizeSecret(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const url = normalizeSecret(process.env.NEXT_PUBLIC_SUPABASE_URL)
  if (!serviceRoleKey || !url) return null
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } })
}
