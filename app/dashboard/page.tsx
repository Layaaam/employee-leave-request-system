import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FilterBar from './FilterBar'
import RequestTable from './RequestTable'
import NewRequestButton from './NewRequestButton'
import { signOut } from './actions'

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

  if (profile?.role === 'admin') {
    redirect('/admin')
  }

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

  const { data: requests, error, count } = await query

  const { data: leaveTypes } = await supabase
    .from('leave_types')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Leave Requests</h1>
          <p className="text-sm text-slate-500">
            Signed in as {profile?.full_name ?? user.email}
            {profile?.role === 'admin' && (
              <span className="ml-2 text-xs uppercase tracking-wide text-slate-400">Admin</span>
            )}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-3 py-1.5"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <FilterBar leaveTypes={leaveTypes ?? []} currentParams={sp} />
        <NewRequestButton leaveTypes={leaveTypes ?? []} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 mb-4">
          Could not load requests: {error.message}
        </p>
      )}

      <RequestTable requests={requests ?? []} leaveTypes={leaveTypes ?? []} />

      {(count ?? 0) > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>
            Page {page} of {totalPages}
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
    </main>
  )
}
