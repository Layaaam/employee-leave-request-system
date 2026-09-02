import { createClient } from '@/lib/supabase/server'
import { getAdminIdentity } from './data'
import FilterBar from './FilterBar'
import AdminRequestTable from './AdminRequestTable'
import StatCards from '@/app/dashboard/StatCards'
import ExportCsvButton from './ExportCsvButton'
import RealtimeRequestListener from './RealtimeRequestListener'

const PAGE_SIZE = 10

type SearchParams = {
  status?: string
  leave_type_id?: string
  q?: string
  date_from?: string
  date_to?: string
  page?: string
}

type LeaveRequestEvent = {
  id: string
  leave_request_id: string
  previous_status: string | null
  new_status: string
  comment: string | null
  created_at: string
  actor_id: string | null
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await getAdminIdentity()

  const sp = await searchParams
  const supabase = await createClient()

  const page = Math.max(1, Number(sp.page) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('leave_requests')
    .select(
      `*,
      leave_type:leave_types(id, name),
      employee:profiles!leave_requests_employee_id_fkey(id, full_name),
      reviewer:profiles!leave_requests_reviewed_by_fkey(id, full_name)`,
      { count: 'exact' }
    )
    .order('status', { ascending: true })
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

  const requestsPromise = query
  const leaveTypesPromise = supabase.from('leave_types').select('id, name').order('name')
  const countsPromise = Promise.all([
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
  ])

  const [
    { data: requests, error, count },
    { data: leaveTypes },
    [{ count: pendingCount }, { count: approvedCount }, { count: rejectedCount }],
  ] = await Promise.all([requestsPromise, leaveTypesPromise, countsPromise])

  const requestIds = (requests ?? []).map((request) => request.id)
  const { data: events } =
    requestIds.length > 0
      ? await supabase
          .from('leave_request_events')
          .select('id, leave_request_id, previous_status, new_status, comment, created_at, actor_id')
          .in('leave_request_id', requestIds)
          .order('created_at', { ascending: true })
      : { data: [] as LeaveRequestEvent[] }

  const eventsByRequest = ((events ?? []) as LeaveRequestEvent[]).reduce<
    Record<string, Omit<LeaveRequestEvent, 'leave_request_id'>[]>
  >((acc, event) => {
    const { leave_request_id, ...timelineEvent } = event
    acc[leave_request_id] = [...(acc[leave_request_id] ?? []), timelineEvent]
    return acc
  }, {})

  const requestsWithEvents = (requests ?? []).map((request) => ({
    ...request,
    events: eventsByRequest[request.id] ?? [],
  }))

  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1

  return (
    <div>
      <RealtimeRequestListener />
      <StatCards pending={pendingCount ?? 0} approved={approvedCount ?? 0} rejected={rejectedCount ?? 0} />

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <h2 className="text-lg font-semibold text-foreground">All Leave Requests</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterBar leaveTypes={leaveTypes ?? []} currentParams={sp} />
          <ExportCsvButton />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive mb-4">
          Could not load requests: {error.message}
        </p>
      )}

      <AdminRequestTable
        requests={requestsWithEvents}
        page={page}
        totalPages={totalPages}
        totalCount={count ?? 0}
      />
    </div>
  )
}
