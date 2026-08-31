'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconEye, IconCheck, IconX } from '@tabler/icons-react'
import StatusBadge from '@/app/dashboard/StatusBadge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import EventTimeline from '@/app/dashboard/EventTimeline'
import RejectModal from './RejectModal'
import BulkRejectModal from './BulkRejectModal'

type Person = { id: string; full_name: string } | null

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
}

export default function AdminRequestTable({ requests }: { requests: AdminLeaveRequest[] }) {
  const router = useRouter()
  const [viewing, setViewing] = useState<AdminLeaveRequest | null>(null)
  const [rejecting, setRejecting] = useState<AdminLeaveRequest | null>(null)
  const [bulkRejecting, setBulkRejecting] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [isApproving, startApproving] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isBulkApproving, startBulkApproving] = useTransition()

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
        toast.error('Could not approve request', { description: 'Network error — please try again.' })
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

  if (requests.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No leave requests match your filters. Try adjusting the filters above.
      </div>
    )
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
            <IconCheck /> {isBusy(r.id) ? 'Approving…' : 'Approve'}
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
              <IconCheck /> {isBulkApproving ? 'Approving…' : `Approve ${selected.size}`}
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

      {/* Mobile: stacked cards (no bulk-select on mobile, kept simple) */}
      <div className="md:hidden space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-medium text-foreground">{r.employee?.full_name ?? '—'}</p>
                <p className="text-sm text-muted-foreground">{r.leave_type?.name ?? '—'}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {r.start_date} → {r.end_date} · {r.days_requested} days
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
              <th className="w-10 px-4 py-2">
                {pendingRequests.length > 0 && (
                  <Checkbox
                    checked={allPendingSelected}
                    onCheckedChange={toggleAllPending}
                    aria-label="Select all pending"
                  />
                )}
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Employee</th>
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
                <td className="px-4 py-2">
                  {r.status === 'pending' && (
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggleOne(r.id)}
                      aria-label={`Select request from ${r.employee?.full_name ?? 'employee'}`}
                    />
                  )}
                </td>
                <td className="px-4 py-2 text-foreground">{r.employee?.full_name ?? '—'}</td>
                <td className="px-4 py-2 text-foreground">{r.leave_type?.name ?? '—'}</td>
                <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                  {formatDate(r.start_date)} → {formatDate(r.end_date)}
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
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Employee</dt>
                <dd className="text-foreground font-medium">{viewing.employee?.full_name ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Leave type</dt>
                <dd className="text-foreground">{viewing.leave_type?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Dates</dt>
                <dd className="text-foreground">
                  {formatDate(viewing.start_date)} → {formatDate(viewing.end_date)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Days requested</dt>
                <dd className="text-foreground">{viewing.days_requested}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={viewing.status} />
                </dd>
              </div>
              {viewing.reason && (
                <div>
                  <dt className="text-muted-foreground mb-1">Reason</dt>
                  <dd className="text-foreground">{viewing.reason}</dd>
                </div>
              )}
              {viewing.reviewer && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Reviewed by</dt>
                  <dd className="text-foreground">{viewing.reviewer.full_name}</dd>
                </div>
              )}
              {viewing.reviewed_at && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Reviewed at</dt>
                  <dd className="text-foreground">{formatDate(new Date(viewing.reviewed_at).toLocaleString())}</dd>
                </div>
              )}
              {viewing.review_comment && (
                <div>
                  <dt className="text-muted-foreground mb-1">Reviewer comment</dt>
                  <dd className="text-foreground">{viewing.review_comment}</dd>
                </div>
              )}
            </dl>
          )}
          {viewing && <EventTimeline leaveRequestId={viewing.id} />}
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
