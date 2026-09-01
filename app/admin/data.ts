import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Wrapped in React's cache() so calling this from multiple Server
 * Components in the same request (AdminHeader, page.tsx, etc.) only
 * hits Supabase once per request instead of once per caller.
 */
export const getAdminIdentity = cache(async () => {
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

  return { user, profile }
})
