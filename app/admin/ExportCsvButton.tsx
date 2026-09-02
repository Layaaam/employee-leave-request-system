'use client'

import { useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { IconDownload } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { exportLeaveRequestsCsv } from './actions'

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export default function ExportCsvButton() {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleExport() {
    startTransition(async () => {
      const status = searchParams.get('status') ?? undefined
      const leaveTypeId = searchParams.get('leave_type_id') ?? undefined
      const q = searchParams.get('q') ?? undefined

      const result = await exportLeaveRequestsCsv({
        status,
        leave_type_id: leaveTypeId,
        q,
      })

      if ('error' in result) {
        toast.error('Could not export CSV', { description: result.error })
        return
      }

      const { data } = result

      if (data.length === 0) {
        toast.error('Nothing to export', { description: 'No requests match the current filters.' })
        return
      }

      const headers = ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Review Comment', 'Submitted']
      const rows = data.map((r) => {
        const employee = Array.isArray(r.employee) ? r.employee[0] : r.employee
        const leaveType = Array.isArray(r.leave_type) ? r.leave_type[0] : r.leave_type
        return [
          employee?.full_name ?? '',
          leaveType?.name ?? '',
          r.start_date,
          r.end_date,
          String(r.days_requested),
          r.status,
          r.reason ?? '',
          r.review_comment ?? '',
          new Date(r.created_at).toLocaleDateString(),
        ]
          .map((v) => escapeCsvField(String(v)))
          .join(',')
      })
      const csv = [headers.join(','), ...rows].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leave-requests-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${data.length} request${data.length === 1 ? '' : 's'}`)
    })
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isPending}>
      <IconDownload /> {isPending ? 'Exporting…' : 'Export CSV'}
    </Button>
  )
}
