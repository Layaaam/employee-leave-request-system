'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  IconArrowRight,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconLayoutList,
  IconPencil,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import StatusBadge from './StatusBadge'
import RequestForm from './RequestForm'
import RequestDetailContent from './RequestDetailContent'
import { type LeaveRequestEvent } from './EventTimeline'
import EmployeeRequestCalendar, { type CalendarLeaveRequest } from './EmployeeRequestCalendar'
import { deleteLeaveRequest, cancelLeaveRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDateShort, cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

type LeaveType = {
  id: string
  name: string
  requires_documentation: boolean
}

function todayDateStr(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

type LeaveRequest = {
  id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  review_comment: string | null
  reviewed_at: string | null
  created_at: string
  leave_type_id: string
  leave_type: { id: string; name: string } | null
  events?: LeaveRequestEvent[]
}

type ViewMode = 'table' | 'calendar'

function buildPageHref(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams.toString())
  params.set('page', String(page))
  return `?${params.toString()}`
}

function TableSkeleton() {
  return (
    <div className="absolute inset-0 z-10 rounded-lg bg-card/70 backdrop-blur-[1px]">
      <div className="h-full animate-pulse p-4">
        <div className="mb-3 h-8 rounded-md bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 rounded-md bg-muted/80" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RequestTable({
  requests,
  leaveTypes,
  page,
  totalPages,
  totalCount,
}: {
  requests: LeaveRequest[]
  leaveTypes: LeaveType[]
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
  const [viewing, setViewing] = useState<LeaveRequest | null>(null)
  const [editing, setEditing] = useState<LeaveRequest | null>(null)
  const [deletingRequest, setDeletingRequest] = useState<LeaveRequest | null>(null)
  const [cancellingRequest, setCancellingRequest] = useState<LeaveRequest | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCancelling, startCancelling] = useTransition()
  const [isPaginating, startPaginating] = useTransition()
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  function goToPage(nextPage: number) {
    startPaginating(() => {
      router.push(`${pathname}${buildPageHref(searchParams, nextPage)}`, { scroll: false })
    })
  }

  function handleDelete() {
    if (!deletingRequest) return
    const id = deletingRequest.id
    startTransition(async () => {
      const result = await deleteLeaveRequest(id)
      if (result?.error) {
        toast.error('Could not delete request', { description: result.error })
      } else {
        toast.success('Request deleted')
      }
      setDeletingRequest(null)
    })
  }

  function handleCancel() {
    if (!cancellingRequest) return
    const id = cancellingRequest.id
    startCancelling(async () => {
      const result = await cancelLeaveRequest(id)
      if (result?.error) {
        toast.error('Could not cancel request', { description: result.error })
      } else {
        toast.success('Request cancelled')
      }
      setCancellingRequest(null)
    })
  }

  function viewCalendarRequest(request: CalendarLeaveRequest) {
    const fullRequest = requests.find((r) => r.id === request.id)
    if (fullRequest) setViewing(fullRequest)
  }

  const actionButtons = (r: LeaveRequest) => (
    <>
      <Button variant="ghost" size="sm" onClick={() => setViewing(r)}>
        <IconEye /> View
      </Button>
      {r.status === 'pending' && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
            <IconPencil /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeletingRequest(r)}
          >
            <IconTrash /> Delete
          </Button>
        </>
      )}
      {r.status === 'approved' && r.start_date > todayDateStr() && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setCancellingRequest(r)}
        >
          <IconX /> Cancel
        </Button>
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

      <div className="relative" aria-busy={isPaginating}>
        {isPaginating && <TableSkeleton />}

        {requests.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'No leave requests match your filters. Try adjusting the filters above.'
              : "You haven't submitted any leave requests yet. Use \u201cNew request\u201d above to create one."}
          </div>
        ) : viewMode === 'calendar' ? (
          <EmployeeRequestCalendar requests={requests} onViewRequest={viewCalendarRequest} />
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-md border border-border bg-card p-4 shadow-sm shadow-violet-100/30">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-foreground">{r.leave_type?.name ?? '-'}</p>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {formatDateShort(r.start_date)}
                        <IconArrowRight size={14} className="shrink-0 text-muted-foreground/70" />
                        {formatDateShort(r.end_date)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{r.days_requested} day request</p>
                  <div className="flex flex-wrap gap-2 mt-3">{actionButtons(r)}</div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-card shadow-sm shadow-violet-100/30">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Request</th>
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
                        <p className="font-medium text-foreground">{r.leave_type?.name ?? '-'}</p>
                        {r.reason && <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">{r.reason}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {formatDateShort(r.start_date)}
                          <IconArrowRight size={14} className="shrink-0 text-muted-foreground/70" />
                          {formatDateShort(r.end_date)}
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
                events: viewing.events,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit leave request</DialogTitle>
          </DialogHeader>
          {editing && (
            <RequestForm
              leaveTypes={leaveTypes}
              existing={{
                id: editing.id,
                leave_type_id: editing.leave_type_id,
                start_date: editing.start_date,
                end_date: editing.end_date,
                days_requested: editing.days_requested,
                reason: editing.reason,
              }}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingRequest} onOpenChange={(open) => !open && setDeletingRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this leave request?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!cancellingRequest}
        onOpenChange={(open) => !open && setCancellingRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this approved request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the request as cancelled. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? 'Cancelling...' : 'Cancel request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
