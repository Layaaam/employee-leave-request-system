import { createBrowserClient } from '@supabase/ssr'

/**
 * Client-side Supabase client. Uses the anon key — every query made with
 * this client is subject to Row Level Security policies based on the
 * logged-in user's JWT. This is intentional: RLS is the RBAC enforcement
 * layer, not this file.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
