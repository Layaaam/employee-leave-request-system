'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, type FormEvent } from 'react'

type LeaveType = { id: string; name: string }

export default function FilterBar({
  leaveTypes,
  currentParams,
}: {
  leaveTypes: LeaveType[]
  currentParams: { status?: string; leave_type_id?: string; q?: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(currentParams.q ?? '')

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    updateParam('q', q)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={handleSearchSubmit}>
        <input
          type="search"
          placeholder="Search reason…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </form>

      <select
        value={currentParams.status ?? ''}
        onChange={(e) => updateParam('status', e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <select
        value={currentParams.leave_type_id ?? ''}
        onChange={(e) => updateParam('leave_type_id', e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      >
        <option value="">All leave types</option>
        {leaveTypes.map((lt) => (
          <option key={lt.id} value={lt.id}>
            {lt.name}
          </option>
        ))}
      </select>
    </div>
  )
}
