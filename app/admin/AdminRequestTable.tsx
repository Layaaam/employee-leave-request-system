'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconLayoutList,
  IconX,
} from '@tabler/icons-react'
import StatusBadge from '@/app/dashboard/StatusBadge'
import RequestDetailContent from '@/app/dashboard/RequestDetailContent'
import { type LeaveRequestEvent } from '@/app/dashboard/EventTimeline'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDateShort, cn } from '@/lib/utils'
import RejectModal from './RejectModal'
import BulkRejectModal from './BulkRejectModal'
import AdminRequestCalendar, { type CalendarLeaveRequest } from './AdminRequestCalendar'

type Person = { id: string; full_name: string } | null
type ViewMode = 'table' | 'calendar'

type AdminLeaveRequest = {
  id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  review_comment: string | null
  reviewed_at: string | null
  created_at: string
  leave_type: { id: string; name: string } | null
  employee: Person
  reviewer: Person
  events?: LeaveRequestEvent[]
}

function buildPageHref(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams.toString())
  params.set('page', String(page))
  return `?${params.toString()}`
}

function filedTiming(createdAt: string, startDate: string): string {
  const created = new Date(createdAt)
  const createdDateOnly = new Date(created.getFullYear(), created.getMonth(), created.getDate())
  const [y, m, d] = startDate.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const diffDays = Math.round((start.getTime() - createdDateOnly.getTime()) / 86_400_000)

  if (diffDays > 0) return `Filed ${diffDays} day${diffDays === 1 ? '' : 's'} ahead`
  if (diffDays < 0) return `Filed ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} late`
  return 'Filed same day'
}

function TableSkeleton() {
  return (
    <div className="absolute inset-0 z-10 bg-card/70 backdrop-blur-[1px]">
      <div className="h-full animate-pulse p-4">
        <div className="mb-3 h-8 rounded-md bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 rounded-md bg-muted/80" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminRequestTable({
  requests,
  page,
  totalPages,
  totalCount,
}: {
  requests: AdminLeaveRequest[]
  page: number
  totalPages: number
  totalCount: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hasActiveFilters = Boolean(
    searchParams.get('q') ||
      searchParams.get('date_from') ||
      searchParams.get('date_to') ||
      searchParams.get('status') ||
      searchParams.get('leave_type_id')
  )
  const [viewing, setViewing] = useState<AdminLeaveRequest | null>(null)
  const [rejecting, setRejecting] = useState<AdminLeaveRequest | null>(null)
  const [bulkRejecting, setBulkRejecting] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [isApproving, startApproving] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isBulkApproving, startBulkApproving] = useTransition()
  const [isPaginating, startPaginating] = useTransition()
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const allPendingSelected =
    pendingRequests.length > 0 && pendingRequests.every((r) => selected.has(r.id))

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllPending() {
    setSelected(() => {
      if (allPendingSelected) return new Set()
      return new Set(pendingRequests.map((r) => r.id))
    })
  }

  function goToPage(nextPage: number) {
    setSelected(new Set())
    startPaginating(() => {
      router.push(`${pathname}${buildPageHref(searchParams, nextPage)}`, { scroll: false })
    })
  }

  function handleApprove(id: string) {
    setApprovingId(id)
    startApproving(async () => {
      try {
        const res = await fetch(`/api/leave-requests/${id}/approve`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) {
          toast.error('Could not approve request', { description: data.error })
        } else {
          toast.success('Request approved')
          router.refresh()
        }
      } catch {
        toast.error('Could not approve request', { description: 'Network error - please try again.' })
      } finally {
        setApprovingId(null)
      }
    })
  }

  function handleBulkApprove() {
    const ids = Array.from(selected)
    startBulkApproving(async () => {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/leave-requests/${id}/approve`, { method: 'POST' }).then((res) => {
            if (!res.ok) throw new Error('failed')
          })
        )
      )
      const failed = results.filter((r) => r.status === 'rejected').length
      const succeeded = ids.length - failed
      if (succeeded > 0) toast.success(`${succeeded} request${succeeded === 1 ? '' : 's'} approved`)
      if (failed > 0) toast.error(`${failed} request${failed === 1 ? '' : 's'} could not be approved`)
      setSelected(new Set())
      router.refresh()
    })
  }

  function viewCalendarRequest(request: CalendarLeaveRequest) {
    const fullRequest = requests.find((r) => r.id === request.id)
    if (fullRequest) setViewing(fullRequest)
  }

  const isBusy = (id: string) => isApproving && approvingId === id

  const actionButtons = (r: AdminLeaveRequest) => (
    <>
      <Button variant="ghost" size="sm" onClick={() => setViewing(r)}>
        <IconEye /> View
      </Button>
      {r.status === 'pending' && (
        <>
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => handleApprove(r.id)}
            disabled={isBusy(r.id)}
          >
            <IconCheck /> {isBusy(r.id) ? 'Approving...' : 'Approve'}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setRejecting(r)}>
            <IconX /> Reject
          </Button>
        </>
      )}
    </>
  )

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-border bg-muted/40 p-1">
          <Button
            type="button"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={cn(viewMode === 'table' && 'shadow-sm')}
          >
            <IconLayoutList /> Table
          </Button>
          <Button
            type="button"
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className={cn(viewMode === 'calendar' && 'shadow-sm')}
          >
            <IconCalendar /> Calendar
          </Button>
        </div>
        {totalCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} - {totalCount} total
          </p>
        )}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 mb-3 rounded-md border border-primary/30 bg-accent px-4 py-2">
          <p className="text-sm text-foreground">{selected.size} selected</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleBulkApprove}
              disabled={isBulkApproving}
            >
              <IconCheck /> {isBulkApproving ? 'Approving...' : `Approve ${selected.size}`}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkRejecting(true)}>
              <IconX /> Reject {selected.size}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="relative" aria-busy={isPaginating}>
        {isPaginating && <TableSkeleton />}

        {requests.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'No leave requests match your filters. Try adjusting the filters above.'
              : 'There are no leave requests in the system yet.'}
          </div>
        ) : viewMode === 'calendar' ? (
          <AdminRequestCalendar requests={requests} onViewRequest={viewCalendarRequest} />
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-md border border-border bg-card p-4 shadow-sm shadow-violet-100/30">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-foreground">{r.employee?.full_name ?? '-'}</p>
                      <p className="text-sm text-muted-foreground">{r.leave_type?.name ?? '-'}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {formatDateShort(r.start_date)}
                    <IconArrowRight size={14} className="shrink-0 text-muted-foreground/70" />
                    {formatDateShort(r.end_date)} - {r.days_requested} days
                  </p>
                  <p className="text-xs text-muted-foreground/80">{filedTiming(r.created_at, r.start_date)}</p>
                  <div className="flex flex-wrap gap-2 mt-3">{actionButtons(r)}</div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-card shadow-sm shadow-violet-100/40">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      {pendingRequests.length > 0 && (
                        <Checkbox
                          checked={allPendingSelected}
                          onCheckedChange={toggleAllPending}
                          aria-label="Select all pending"
                        />
                      )}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Leave type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dates</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Days</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        {r.status === 'pending' && (
                          <Checkbox
                            checked={selected.has(r.id)}
                            onCheckedChange={() => toggleOne(r.id)}
                            aria-label={`Select request from ${r.employee?.full_name ?? 'employee'}`}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground">{r.employee?.full_name ?? '-'}</td>
                      <td className="px-4 py-3 text-foreground">{r.leave_type?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {formatDateShort(r.start_date)}
                          <IconArrowRight size={14} className="shrink-0 text-muted-foreground/70" />
                          {formatDateShort(r.end_date)}
                        </div>
                        <div className="text-xs text-muted-foreground/80">
                          {filedTiming(r.created_at, r.start_date)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.days_requested}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">{actionButtons(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {totalCount > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>
              Showing page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || isPaginating}
              >
                <IconChevronLeft /> Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || isPaginating}
              >
                Next <IconChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave request details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <RequestDetailContent
              data={{
                id: viewing.id,
                leaveTypeName: viewing.leave_type?.name ?? '-',
                startDate: viewing.start_date,
                endDate: viewing.end_date,
                daysRequested: viewing.days_requested,
                status: viewing.status,
                reason: viewing.reason,
                reviewComment: viewing.review_comment,
                reviewedAt: viewing.reviewed_at,
                employeeName: viewing.employee?.full_name,
                reviewerName: viewing.reviewer?.full_name,
                events: viewing.events,
              }}
              isAdmin
            />
          )}
        </DialogContent>
      </Dialog>

      {rejecting && <RejectModal request={rejecting} onClose={() => setRejecting(null)} />}
      {bulkRejecting && (
        <BulkRejectModal
          ids={Array.from(selected)}
          onClose={() => {
            setBulkRejecting(false)
            setSelected(new Set())
          }}
        />
      )}
    </>
  )
}
