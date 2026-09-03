'use client'

import { useMemo, useState } from 'react'
import { IconArrowRight, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import StatusBadge from '@/app/dashboard/_components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDateShort, cn } from '@/lib/utils'

type Person = { id: string; full_name: string } | null

export type CalendarLeaveRequest = {
  id: string
  start_date: string
  end_date: string
  days_requested: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  leave_type: { id: string; name: string } | null
  employee: Person
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function sameMonth(date: Date, monthDate: Date) {
  return date.getUTCFullYear() === monthDate.getUTCFullYear() && date.getUTCMonth() === monthDate.getUTCMonth()
}

function isWithinRequest(day: Date, request: CalendarLeaveRequest) {
  const start = parseDate(request.start_date)
  const end = parseDate(request.end_date)
  return day >= start && day <= end
}

function statusDotClass(status: CalendarLeaveRequest['status']) {
  return cn(
    'border-l-2',
    status === 'pending' && 'border-amber-400 bg-amber-50 text-amber-800',
    status === 'approved' && 'border-emerald-400 bg-emerald-50 text-emerald-800',
    status === 'cancelled' && 'border-slate-300 bg-slate-50 text-slate-700'
  )
}

export default function AdminRequestCalendar({
  requests,
  onViewRequest,
}: {
  requests: CalendarLeaveRequest[]
  onViewRequest: (request: CalendarLeaveRequest) => void
}) {
  const visibleRequestsAll = useMemo(
    () => requests.filter((request) => request.status !== 'rejected'),
    [requests]
  )

  const initialMonth = useMemo(() => {
    const firstRequest = visibleRequestsAll
      .slice()
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0]
    return firstRequest ? parseDate(firstRequest.start_date) : new Date()
  }, [visibleRequestsAll])
  const [monthDate, setMonthDate] = useState(initialMonth)
  const [dayView, setDayView] = useState<Date | null>(null)

  const calendarDays = useMemo(() => {
    const year = monthDate.getUTCFullYear()
    const month = monthDate.getUTCMonth()
    const firstOfMonth = new Date(Date.UTC(year, month, 1))
    const start = new Date(firstOfMonth)
    start.setUTCDate(firstOfMonth.getUTCDate() - firstOfMonth.getUTCDay())

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start)
      day.setUTCDate(start.getUTCDate() + index)
      return day
    })
  }, [monthDate])

  function moveMonth(offset: number) {
    setMonthDate((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 1)))
  }

  const dayViewRequests = dayView
    ? visibleRequestsAll.filter((request) => isWithinRequest(dayView, request))
    : []

  function handleViewFromDay(request: CalendarLeaveRequest) {
    setDayView(null)
    onViewRequest(request)
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm shadow-violet-100/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {monthDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            })}
          </h3>
          <p className="text-xs text-muted-foreground">Click a date to see everyone on leave that day</p>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={() => moveMonth(-1)} aria-label="Previous month">
            <IconChevronLeft />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => moveMonth(1)} aria-label="Next month">
            <IconChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="px-2 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7">
        {calendarDays.map((day) => {
          const dayRequests = visibleRequestsAll.filter((request) => isWithinRequest(day, request))
          const visibleRequests = dayRequests.slice(0, 2)
          const overflow = dayRequests.length - visibleRequests.length

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-32 border-b border-border p-2 md:border-r',
                !sameMonth(day, monthDate) && 'bg-muted/20 text-muted-foreground'
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => dayRequests.length > 0 && setDayView(day)}
                  disabled={dayRequests.length === 0}
                  className={cn(
                    'rounded-full px-1.5 text-xs font-medium transition',
                    dayRequests.length > 0
                      ? 'text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer'
                      : 'cursor-default'
                  )}
                >
                  {day.getUTCDate()}
                </button>
                {dayRequests.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">{dayRequests.length}</span>
                )}
              </div>
              <div className="space-y-1">
                {visibleRequests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => onViewRequest(request)}
                    className={cn(
                      'block w-full rounded-sm px-2 py-1 text-left text-[11px] transition hover:shadow-sm',
                      statusDotClass(request.status)
                    )}
                  >
                    <span className="block truncate font-medium">{request.employee?.full_name ?? 'Employee'}</span>
                    <span className="block truncate opacity-80">{request.leave_type?.name ?? 'Leave'}</span>
                  </button>
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={() => setDayView(day)}
                    className="px-2 text-left text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-2">
          {['pending', 'approved', 'cancelled'].map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
        {visibleRequestsAll.length > 0 && (
          <span>
            Showing {visibleRequestsAll.length} request{visibleRequestsAll.length === 1 ? '' : 's'} from this result
            page
          </span>
        )}
        {visibleRequestsAll.length === 0 && <span>No requests to place on the calendar.</span>}
      </div>

      <Dialog open={!!dayView} onOpenChange={(open) => !open && setDayView(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dayView &&
                dayView.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {dayViewRequests.length === 0 && (
              <p className="text-sm text-muted-foreground">No leave requests on this date.</p>
            )}
            {dayViewRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => handleViewFromDay(request)}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-border p-3 text-left transition hover:bg-accent/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {request.employee?.full_name ?? 'Employee'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{request.leave_type?.name ?? 'Leave'}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/80">
                    {formatDateShort(request.start_date)}
                    <IconArrowRight size={12} className="shrink-0" />
                    {formatDateShort(request.end_date)}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}