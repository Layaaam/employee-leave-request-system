import { createClient } from '@/lib/supabase/server'
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

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
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

  const { data: requests, error, count } = await query

  const { data: leaveTypes } = await supabase.from('leave_types').select('id, name').order('name')

  const [{ count: pendingCount }, { count: approvedCount }, { count: rejectedCount }] =
    await Promise.all([
      supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    ])

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

      <AdminRequestTable requests={requests ?? []} />

      {(count ?? 0) > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {count} total
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
    </div>
  )
}
