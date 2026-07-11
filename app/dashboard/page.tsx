import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardAccess } from '@/lib/dashboard/access'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/barber?next=/dashboard')

  const access = await getDashboardAccess(user.id)

  if (access.shop) {
    redirect('/dashboard/agenda')
  } else {
    redirect('/onboarding')
  }
}
