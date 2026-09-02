import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const getDashboardIdentity = cache(async () => {
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

  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  const [{ count: pendingCount }, { count: approvedCount }, { count: rejectedCount }] =
    await Promise.all([
      supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', user.id)
        .eq('status', 'pending'),
      supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', user.id)
        .eq('status', 'approved'),
      supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', user.id)
        .eq('status', 'rejected'),
    ])

  return {
    user,
    profile,
    pendingCount: pendingCount ?? 0,
    approvedCount: approvedCount ?? 0,
    rejectedCount: rejectedCount ?? 0,
  }
})
