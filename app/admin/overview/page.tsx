import { createClient } from '@/lib/supabase/server'
import { getAdminIdentity } from '../data'
import OverviewClient from './OverviewClient'

function todayDateStr(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default async function AdminOverviewPage() {
  await getAdminIdentity()
  const supabase = await createClient()
  const today = todayDateStr()

  const requestsPromise = supabase
    .from('leave_requests')
    .select(
      `id, start_date, end_date, days_requested, reason, status, review_comment, reviewed_at, created_at,
      leave_type:leave_types(id, name),
      employee:profiles!leave_requests_employee_id_fkey(id, full_name)`
    )
    .in('status', ['pending', 'approved'])
    .order('start_date', { ascending: true })

  const activeLeavePromise = supabase
    .from('leave_requests')
    .select(
      `id, start_date, end_date, days_requested,
      leave_type:leave_types(id, name),
      employee:profiles!leave_requests_employee_id_fkey(id, full_name)`
    )
    .eq('status', 'approved')
    .lte('start_date', today)
    .gte('end_date', today)
    .order('end_date', { ascending: true })

  const [{ data: requests, error }, { data: activeLeave }] = await Promise.all([
    requestsPromise,
    activeLeavePromise,
  ])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Leave Overview</h2>
        <p className="text-sm text-muted-foreground">
          A company-wide calendar of upcoming leave, and who&apos;s out right now.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive mb-4">
          Could not load leave overview: {error.message}
        </p>
      )}

      <OverviewClient requests={requests ?? []} activeLeave={activeLeave ?? []} />
    </div>
  )
}
