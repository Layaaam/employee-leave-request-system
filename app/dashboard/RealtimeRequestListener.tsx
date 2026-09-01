'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

// Subscribes to UPDATE events on this employee's own leave_requests rows,
// so an approval or rejection from the admin console appears live without
// the employee having to manually refresh. Mirrors the admin-side listener
// (Phase F) but on the other side of the workflow — previously only new
// submissions were realtime; status changes flowing back to the employee
// were not.
export default function RealtimeRequestListener({ employeeId }: { employeeId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`employee-leave-requests-${employeeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leave_requests',
          filter: `employee_id=eq.${employeeId}`,
        },
        (payload) => {
          const status = (payload.new as { status?: string }).status
          if (status === 'approved') {
            toast.success('One of your leave requests was approved')
          } else if (status === 'rejected') {
            toast.error('One of your leave requests was rejected')
          } else {
            toast.info('One of your leave requests was updated')
          }
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [employeeId, router])

  return null
}
