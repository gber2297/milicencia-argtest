import { redirect } from "next/navigation"

import { OnboardingWizard } from "@/components/app/onboarding-wizard"
import { requireUser } from "@/lib/auth"
import { getCategories } from "@/lib/queries/app"
import { createClient } from "@/lib/supabase/server"
import { getUserPreferences } from "@/lib/user-preferences"

const OnboardingPage = async () => {
  await requireUser()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const prefs = await getUserPreferences(supabase, user.id)
  if (prefs?.onboarding_completed) redirect("/dashboard")

  const categories = await getCategories()
  return <OnboardingWizard categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
}

export default OnboardingPage
