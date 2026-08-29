import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/dashboard/actions'
import AdminNav from './AdminNav'

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

  // Route-level enforcement, on top of RLS: a non-admin who navigates here
  // directly is bounced back to their own dashboard.
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Admin Console</h1>
            <p className="text-sm text-slate-500">
              Signed in as {profile?.full_name ?? user.email}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-3 py-1.5"
            >
              Sign out
            </button>
          </form>
        </div>
        <AdminNav />
      </header>
      <div className="max-w-6xl w-full mx-auto p-6">{children}</div>
    </div>
  )
}
