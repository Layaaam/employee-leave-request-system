import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. This BYPASSES Row Level Security entirely.
 *
 * Use ONLY inside trusted server-side code (Route Handlers under /app/api)
 * where you have already independently verified the caller's identity and
 * role — e.g. the approve/reject endpoints in Phase 4.
 *
 * NEVER import this file into any Client Component or expose
 * SUPABASE_SERVICE_ROLE_KEY to the browser (no NEXT_PUBLIC_ prefix on it,
 * on purpose).
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
