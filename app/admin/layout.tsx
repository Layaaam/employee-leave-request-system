import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/dashboard/actions'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex-1 w-full flex flex-col md:flex-row bg-white/90 shadow-sm border border-border/60 overflow-hidden">
      <AdminSidebar signOutAction={signOut} />

      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gradient-to-br from-white via-violet-50/30 to-pink-50/40">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Admin Console</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {profile?.full_name ?? user.email}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
