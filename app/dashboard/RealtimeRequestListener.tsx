'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

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
