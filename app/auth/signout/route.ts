import { NextResponse } from "next/server"

import { publicRedirectUrl } from "@/lib/public-url"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(publicRedirectUrl(request, "/"))
}
