'use client'

import { useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { IconDownload } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

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
      const supabase = createClient()

      let query = supabase
        .from('leave_requests')
        .select(
          `start_date, end_date, days_requested, status, reason, review_comment, created_at,
          leave_type:leave_types(name),
          employee:profiles!leave_requests_employee_id_fkey(full_name)`
        )
        .order('created_at', { ascending: false })

      const status = searchParams.get('status')
      const leaveTypeId = searchParams.get('leave_type_id')
      const q = searchParams.get('q')
      if (status) query = query.eq('status', status)
      if (leaveTypeId) query = query.eq('leave_type_id', leaveTypeId)
      if (q) query = query.ilike('reason', `%${q}%`)

      const { data, error } = await query

      if (error || !data) {
        toast.error('Could not export CSV', { description: error?.message })
        return
      }

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
