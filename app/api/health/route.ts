import { NextResponse } from 'next/server'

// Placeholder for Phase 0. Phase 5 wires this to a trivial Supabase query
// (e.g. `select 1` against leave_types) so the GitHub Actions keep-alive
// cron has something real to ping and prevent Supabase's 7-day auto-pause.
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
