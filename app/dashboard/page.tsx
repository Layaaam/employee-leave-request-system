import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FilterBar from './FilterBar'
import RequestTable from './RequestTable'
import NewRequestButton from './NewRequestButton'
import StatCards from './StatCards'
import LeaveBalance from './LeaveBalance'
import { signOut } from './actions'
import { Button } from '@/components/ui/button'
import RealtimeRequestListener from './RealtimeRequestListener'

const PAGE_SIZE = 5

type SearchParams = {
  status?: string
  leave_type_id?: string
  q?: string
  page?: string
}

function buildHref(params: SearchParams, page: number) {
  const p = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
      if (v) acc[k] = v
      return acc
    }, {})
  )
  p.set('page', String(page))
  return `?${p.toString()}`
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
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

  // Now that /admin exists, keep admins on their own console instead of
  // showing them the employee view (deferred here since Phase 3, per plan).
  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  const page = Math.max(1, Number(sp.page) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Server-side filtering, sorting, and pagination — never fetch-all-then-
  // filter client-side (per the plan's performance guidance).
  let query = supabase
    .from('leave_requests')
    .select('*, leave_type:leave_types(id, name)', { count: 'exact' })
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (sp.status) {
    query = query.eq('status', sp.status)
  }
  if (sp.leave_type_id) {
    query = query.eq('leave_type_id', sp.leave_type_id)
  }
  if (sp.q) {
    query = query.ilike('reason', `%${sp.q}%`)
  }

  const { data: requests, error, count } = await query

  const { data: leaveTypes } = await supabase
    .from('leave_types')
    .select('id, name, default_days_allowed, notice_period_days, requires_documentation')
    .eq('is_active', true)
    .order('name')

  // Lightweight count-only queries (head: true returns no rows, just a
  // count) — cheaper than fetching full result sets just to count them.
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

  // Leave balance: sum of approved days this year, grouped by leave type.
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

  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-6">
      <RealtimeRequestListener employeeId={user.id} />
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">My Leave Requests</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {profile?.full_name ?? user.email}
            {profile?.role === 'admin' && (
              <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">Admin</span>
            )}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </header>

      <StatCards pending={pendingCount ?? 0} approved={approvedCount ?? 0} rejected={rejectedCount ?? 0} />

      <LeaveBalance leaveTypes={leaveTypes ?? []} usage={usage} />

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <FilterBar leaveTypes={leaveTypes ?? []} currentParams={sp} />
        <NewRequestButton leaveTypes={leaveTypes ?? []} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive mb-4">
          Could not load requests: {error.message}
        </p>
      )}

      <RequestTable requests={requests ?? []} leaveTypes={leaveTypes ?? []} />

      {(count ?? 0) > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-4">
            {page > 1 && (
              <a href={buildHref(sp, page - 1)} className="underline hover:text-foreground">
                Previous
              </a>
            )}
            {page < totalPages && (
              <a href={buildHref(sp, page + 1)} className="underline hover:text-foreground">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
