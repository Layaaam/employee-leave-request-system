import { createClient } from '@/lib/supabase/server'
import LeaveBalance from '../LeaveBalance'
import { getDashboardIdentity } from '../data'

export default async function OverviewPage() {
  const { user } = await getDashboardIdentity()
  const supabase = await createClient()

  const { data: leaveTypes } = await supabase
    .from('leave_types')
    .select('id, name, default_days_allowed, requires_documentation')
    .eq('is_active', true)
    .order('name')

  const currentYear = new Date().getFullYear()
  const { data: approvedThisYear } = await supabase
    .from('leave_requests')
    .select('leave_type_id, days_requested')
    .eq('employee_id', user.id)
    .eq('status', 'approved')
    .gte('start_date', `${currentYear}-01-01`)
    .lte('start_date', `${currentYear}-12-31`)

  const usage = (approvedThisYear ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.leave_type_id] = (acc[r.leave_type_id] ?? 0) + r.days_requested
    return acc
  }, {})

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your leave balances for {currentYear}.
        </p>
      </div>

      <LeaveBalance leaveTypes={leaveTypes ?? []} usage={usage} />
    </>
  )
}
