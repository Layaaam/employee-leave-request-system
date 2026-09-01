import StatusBadge from './StatusBadge'
import EventTimeline, { type LeaveRequestEvent } from './EventTimeline'
import { formatDate, formatDateTime, cn } from '@/lib/utils'

type Status = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type RequestDetailData = {
  id: string
  leaveTypeName: string
  startDate: string
  endDate: string
  daysRequested: number
  status: Status
  reason: string | null
  reviewComment: string | null
  reviewedAt: string | null
  employeeName?: string | null
  reviewerName?: string | null
  events?: LeaveRequestEvent[]
}

export default function RequestDetailContent({ data }: { data: RequestDetailData }) {
  const isReviewed = data.status === 'approved' || data.status === 'rejected'
  const reviewPanelClass =
    data.status === 'approved'
      ? 'bg-emerald-50 border-emerald-200'
      : data.status === 'rejected'
        ? 'bg-rose-50 border-rose-200'
        : ''

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-gradient-to-br from-white to-purple-50/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Leave request</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{data.leaveTypeName}</p>
            {data.employeeName && <p className="text-sm text-muted-foreground">{data.employeeName}</p>}
          </div>
          <StatusBadge status={data.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Dates</p>
          <p className="mt-1 text-foreground font-medium">
            {formatDate(data.startDate)} - {formatDate(data.endDate)}
          </p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Days requested</p>
          <p className="mt-1 text-foreground font-medium">{data.daysRequested}</p>
        </div>
      </div>

      {data.reason && (
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Reason</p>
          <p className="text-sm text-foreground">{data.reason}</p>
        </div>
      )}

      {isReviewed && (
        <div className={cn('rounded-md border p-3 space-y-1', reviewPanelClass)}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {data.status === 'approved' ? 'Approved' : 'Rejected'}
            {data.reviewerName && ` by ${data.reviewerName}`}
            {data.reviewedAt && ` - ${formatDateTime(data.reviewedAt)}`}
          </p>
          {data.reviewComment && <p className="text-sm text-foreground">{data.reviewComment}</p>}
        </div>
      )}

      <EventTimeline leaveRequestId={data.id} initialEvents={data.events} />
    </div>
  )
}
