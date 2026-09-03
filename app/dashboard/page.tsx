import { createClient } from '@/lib/supabase/server'
import FilterBar from './_components/FilterBar'
import RequestTable from './_components/RequestTable'
import NewRequestButton from './_components/NewRequestButton'
import RealtimeRequestListener from './_components/RealtimeRequestListener'
import { getDashboardIdentity } from './data'

const PAGE_SIZE = 5

type SearchParams = {
  status?: string
  leave_type_id?: string
  q?: string
  date_from?: string
  date_to?: string
  page?: string
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const { user } = await getDashboardIdentity()
  const supabase = await createClient()
  const page = Math.max(1, Number(sp.page) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

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
  if (sp.date_from) {
    query = query.gte('start_date', sp.date_from)
  }
  if (sp.date_to) {
    query = query.lte('end_date', sp.date_to)
  }

  const { data: requests, error, count } = await query

  const { data: leaveTypes } = await supabase
    .from('leave_types')
    .select('id, name, default_days_allowed, requires_documentation')
    .eq('is_active', true)
    .order('name')

  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1

  return (
    <>
      <RealtimeRequestListener employeeId={user.id} />

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">My Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and manage the leave requests you&apos;ve submitted.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <FilterBar leaveTypes={leaveTypes ?? []} currentParams={sp} />
        <NewRequestButton leaveTypes={leaveTypes ?? []} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive mb-4">
          Could not load requests: {error.message}
        </p>
      )}

      <RequestTable
        requests={requests ?? []}
        leaveTypes={leaveTypes ?? []}
        page={page}
        totalPages={totalPages}
        totalCount={count ?? 0}
      />
    </>
  )
}
