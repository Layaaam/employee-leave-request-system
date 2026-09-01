'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { IconEye, IconPencil, IconTrash } from '@tabler/icons-react'
import StatusBadge from './StatusBadge'
import RequestForm from './RequestForm'
import RequestDetailContent from './RequestDetailContent'
import { deleteLeaveRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDateShort } from '@/lib/utils'
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
  notice_period_days: number | null
  requires_documentation: boolean
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
}

export default function RequestTable({
  requests,
  leaveTypes,
}: {
  requests: LeaveRequest[]
  leaveTypes: LeaveType[]
}) {
  const [viewing, setViewing] = useState<LeaveRequest | null>(null)
  const [editing, setEditing] = useState<LeaveRequest | null>(null)
  const [deletingRequest, setDeletingRequest] = useState<LeaveRequest | null>(null)
  const [isPending, startTransition] = useTransition()

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

  if (requests.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No leave requests match your filters yet. Try adjusting your filters, or click{' '}
        <span className="font-medium text-foreground">&ldquo;New request&rdquo;</span> above to create one.
      </div>
    )
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
    </>
  )

  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-medium text-foreground">{r.leave_type?.name ?? '—'}</p>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateShort(r.start_date)} → {formatDateShort(r.end_date)} · {r.days_requested} days
            </p>
            <div className="flex flex-wrap gap-2 mt-3">{actionButtons(r)}</div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-md border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Leave type</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Dates</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Days</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-foreground">{r.leave_type?.name ?? '—'}</td>
                <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                  {formatDateShort(r.start_date)} → {formatDateShort(r.end_date)}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{r.days_requested}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-2 text-right space-x-1 whitespace-nowrap">{actionButtons(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave request details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <RequestDetailContent
              data={{
                id: viewing.id,
                leaveTypeName: viewing.leave_type?.name ?? '—',
                startDate: viewing.start_date,
                endDate: viewing.end_date,
                daysRequested: viewing.days_requested,
                status: viewing.status,
                reason: viewing.reason,
                reviewComment: viewing.review_comment,
                reviewedAt: viewing.reviewed_at,
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
              {isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
