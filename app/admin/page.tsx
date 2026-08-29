import { createClient } from '@/lib/supabase/server'
import FilterBar from './FilterBar'
import AdminRequestTable from './AdminRequestTable'

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

  // Both employee_id and reviewed_by reference profiles, so each embed
  // needs its FK explicitly named to disambiguate — avoids a second
  // round trip per row (no N+1) while resolving the ambiguity.
  let query = supabase
    .from('leave_requests')
    .select(
      `*,
      leave_type:leave_types(id, name),
      employee:profiles!leave_requests_employee_id_fkey(id, full_name),
      reviewer:profiles!leave_requests_reviewed_by_fkey(id, full_name)`,
      { count: 'exact' }
    )
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

  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <h2 className="text-lg font-semibold text-slate-900">All Leave Requests</h2>
        <FilterBar leaveTypes={leaveTypes ?? []} currentParams={sp} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 mb-4">
          Could not load requests: {error.message}
        </p>
      )}

      <AdminRequestTable requests={requests ?? []} />

      {(count ?? 0) > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>
            Page {page} of {totalPages} · {count} total
          </span>
          <div className="flex gap-4">
            {page > 1 && (
              <a href={buildHref(sp, page - 1)} className="underline hover:text-slate-900">
                Previous
              </a>
            )}
            {page < totalPages && (
              <a href={buildHref(sp, page + 1)} className="underline hover:text-slate-900">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
