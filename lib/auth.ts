import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

const AUTH_ROUTES = ["/login", "/register"]

export async function requireUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) redirect("/login")
  return data.user
}

export async function redirectIfAuthenticated() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data.user) redirect("/dashboard")
}

export async function requireAdmin() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || profile.role !== "admin") redirect("/dashboard")
  return user
}

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.includes(pathname)
}
