'use client'

import { useState } from 'react'
import { IconArrowRight, IconUserCircle } from '@tabler/icons-react'
import AdminRequestCalendar, { type CalendarLeaveRequest } from '../_components/AdminRequestCalendar'
import RequestDetailContent from '@/app/dashboard/_components/RequestDetailContent'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDateShort } from '@/lib/utils'

type Person = { id: string; full_name: string } | null

type OverviewRequest = {
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
}

type ActiveLeave = {
  id: string
  start_date: string
  end_date: string
  days_requested: number
  leave_type: { id: string; name: string } | null
  employee: Person
}

export default function OverviewClient({
  requests,
  activeLeave,
}: {
  requests: OverviewRequest[]
  activeLeave: ActiveLeave[]
}) {
  const [viewing, setViewing] = useState<OverviewRequest | null>(null)

  function handleView(request: CalendarLeaveRequest) {
    const full = requests.find((r) => r.id === request.id)
    if (full) setViewing(full)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm shadow-violet-100/40">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          On leave right now ({activeLeave.length})
        </h3>
        {activeLeave.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one is currently on approved leave.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activeLeave.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50/60 p-3"
              >
                <IconUserCircle className="mt-0.5 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {r.employee?.full_name ?? 'Employee'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{r.leave_type?.name ?? 'Leave'}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/80">
                    {formatDateShort(r.start_date)}
                    <IconArrowRight size={12} className="shrink-0" />
                    {formatDateShort(r.end_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminRequestCalendar requests={requests} onViewRequest={handleView} />

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
              }}
              isAdmin
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
