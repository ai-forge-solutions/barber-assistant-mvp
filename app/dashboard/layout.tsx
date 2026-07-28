import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardAccess } from '@/lib/dashboard/access'
import AppNav from '@/components/nav/AppNav'
import BottomTabBar from './BottomTabBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/barber?next=/dashboard')

  const access = await getDashboardAccess(user.id)
  if (access.shop && !access.hasActiveSubscription) redirect('/billing')

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AppNav />
      <main className="flex-1 flex flex-col pb-[64px] max-w-lg mx-auto w-full">
        {children}
      </main>
      <BottomTabBar />
    </div>
  )
}
