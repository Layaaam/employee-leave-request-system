'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from './data'

export async function addLeaveRequestComment(
  leaveRequestId: string,
  comment: string
): Promise<{ error: string | null }> {
  const admin = await requireAdmin()
  if (!admin.ok) {
    return { error: admin.error }
  }

  const trimmed = comment.trim()
  if (!trimmed) {
    return { error: 'Comment cannot be empty.' }
  }
  if (trimmed.length > 2000) {
    return { error: 'Comment is too long (2000 characters max).' }
  }

  const supabase = await createClient()

  const { data: request, error: requestError } = await supabase
    .from('leave_requests')
    .select('id, status')
    .eq('id', leaveRequestId)
    .single()

  if (requestError || !request) {
    return { error: 'Leave request not found.' }
  }
  if (request.status !== 'pending') {
    return { error: 'Comments can only be added while a request is still pending.' }
  }

  const { error } = await supabase.from('leave_request_comments').insert({
    leave_request_id: leaveRequestId,
    author_id: admin.user.id,
    comment: trimmed,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/overview')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/overview')
  return { error: null }
}

export type ExportRow = {
  start_date: string
  end_date: string
  days_requested: number
  status: string
  reason: string | null
  review_comment: string | null
  created_at: string
  leave_type: { name: string } | { name: string }[] | null
  employee: { full_name: string } | { full_name: string }[] | null
}

export async function exportLeaveRequestsCsv(filters: {
  status?: string
  leave_type_id?: string
  q?: string
}): Promise<{ data: ExportRow[] } | { error: string }> {
  const admin = await requireAdmin()
  if (!admin.ok) {
    return { error: admin.error }
  }

  const supabase = await createClient()

  let query = supabase
    .from('leave_requests')
    .select(
      `start_date, end_date, days_requested, status, reason, review_comment, created_at,
      leave_type:leave_types(name),
      employee:profiles!leave_requests_employee_id_fkey(full_name)`
    )
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.leave_type_id) query = query.eq('leave_type_id', filters.leave_type_id)
  if (filters.q) query = query.ilike('reason', `%${filters.q}%`)

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as ExportRow[] }
}
