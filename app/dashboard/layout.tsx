import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/nav/AppNav'
import BottomTabBar from './BottomTabBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

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
