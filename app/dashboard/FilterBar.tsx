'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type LeaveType = { id: string; name: string }

const ALL = '__all__'

export default function FilterBar({
  leaveTypes,
  currentParams,
}: {
  leaveTypes: LeaveType[]
  currentParams: {
    status?: string
    leave_type_id?: string
    q?: string
    date_from?: string
    date_to?: string
  }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(currentParams.q ?? '')
  const [dateFrom, setDateFrom] = useState(currentParams.date_from ?? '')
  const [dateTo, setDateTo] = useState(currentParams.date_to ?? '')
  const [isPending, startTransition] = useTransition()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (q) params.set('q', q)
    else params.delete('q')
    if (dateFrom) params.set('date_from', dateFrom)
    else params.delete('date_from')
    if (dateTo) params.set('date_to', dateTo)
    else params.delete('date_to')
    params.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 transition-opacity ${isPending ? 'opacity-60' : ''}`}
      aria-busy={isPending}
    >
      <form onSubmit={handleSearchSubmit}>
        <Input
          type="search"
          placeholder="Search reason…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-48"
        />
      </form>

      <Select value={currentParams.status ?? ALL} onValueChange={(v) => updateParam('status', v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={currentParams.leave_type_id ?? ALL}
        onValueChange={(v) => updateParam('leave_type_id', v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All leave types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All leave types</SelectItem>
          {leaveTypes.map((lt) => (
            <SelectItem key={lt.id} value={lt.id}>
              {lt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && <IconLoader2 className="animate-spin text-muted-foreground" />}
    </div>
  )
}
