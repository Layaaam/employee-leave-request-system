'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { IconLoader2, IconSearch, IconX } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import DatePicker from '@/app/dashboard/_components/DatePicker'

type LeaveType = { id: string; name: string }

const ALL = '__all__'

export default function FilterBar({
  leaveTypes,
  currentParams,
}: {
  leaveTypes: LeaveType[]
  currentParams: { status?: string; leave_type_id?: string; q?: string; date_from?: string; date_to?: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(currentParams.q ?? '')
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
    updateParam('q', q)
  }

  const hasActiveFilters = Boolean(
    currentParams.q ||
      currentParams.date_from ||
      currentParams.date_to ||
      currentParams.status ||
      currentParams.leave_type_id
  )

  function handleClearAll() {
    setQ('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 transition-opacity ${isPending ? 'opacity-60' : ''}`}
      aria-busy={isPending}
    >
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
        <Input
          type="search"
          placeholder="Search reason…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-48"
        />
        <Button type="submit" variant="ghost" size="icon" aria-label="Search">
          <IconSearch className="text-muted-foreground" />
        </Button>
      </form>

      <DatePicker
        value={currentParams.date_from ?? ''}
        onChange={(v) => updateParam('date_from', v)}
        max={currentParams.date_to || undefined}
        placeholder="From date"
        clearable
        className="w-36"
      />
      <span className="text-xs text-muted-foreground">to</span>
      <DatePicker
        value={currentParams.date_to ?? ''}
        onChange={(v) => updateParam('date_to', v)}
        min={currentParams.date_from || undefined}
        placeholder="To date"
        clearable
        className="w-36"
      />

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

      {hasActiveFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <IconX className="mr-1" size={14} />
          Clear filters
        </Button>
      )}

      {isPending && <IconLoader2 className="animate-spin text-muted-foreground" />}
    </div>
  )
}
