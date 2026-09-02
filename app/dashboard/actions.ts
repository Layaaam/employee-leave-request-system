'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

function todayDateStr(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function inclusiveCalendarDays(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1
}

function inclusiveBusinessDays(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  let count = 0
  const cursor = new Date(startDate)
  while (cursor.getTime() <= endDate.getTime()) {
    const day = cursor.getUTCDay()
    if (day !== 0 && day !== 6) count++
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return count
}

function computeDaysRequested(start: string, end: string, excludeWeekends: boolean): number {
  return excludeWeekends ? inclusiveBusinessDays(start, end) : inclusiveCalendarDays(start, end)
}

type ActionResult = { error: string; field?: 'leave_type_id' | 'start_date' | 'end_date' | 'general' } | { error: null }

export async function createLeaveRequest(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const leave_type_id = formData.get('leave_type_id') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const exclude_weekends = formData.get('exclude_weekends') === 'true'
  const reason = (formData.get('reason') as string) || null

  if (!leave_type_id) {
    return { error: 'Please select a leave type.', field: 'leave_type_id' }
  }
  if (!start_date) {
    return { error: 'Please select a start date.', field: 'start_date' }
  }
  if (!end_date) {
    return { error: 'Please select an end date.', field: 'end_date' }
  }

  if (end_date < start_date) {
    return { error: 'End date cannot be before the start date.', field: 'end_date' }
  }

  const days_requested = computeDaysRequested(start_date, end_date, exclude_weekends)

  const { data: leaveType, error: leaveTypeError } = await supabase
    .from('leave_types')
    .select('id')
    .eq('id', leave_type_id)
    .single()

  if (leaveTypeError || !leaveType) {
    return { error: 'Selected leave type could not be found.', field: 'leave_type_id' }
  }

  const { data: overlapping, error: overlapError } = await supabase
    .from('leave_requests')
    .select('id')
    .eq('employee_id', user.id)
    .in('status', ['pending', 'approved'])
    .lte('start_date', end_date)
    .gte('end_date', start_date)
    .limit(1)

  if (overlapError) {
    return { error: overlapError.message, field: 'general' }
  }
  if (overlapping && overlapping.length > 0) {
    return {
      error: 'This overlaps with an existing pending or approved request.',
      field: 'start_date',
    }
  }

  const { error } = await supabase.from('leave_requests').insert({
    employee_id: user.id,
    leave_type_id,
    start_date,
    end_date,
    days_requested,
    reason,
  })

  if (error) {
    return { error: error.message, field: 'general' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/overview')
  return { error: null }
}

export async function updateLeaveRequest(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: existing, error: fetchError } = await supabase
    .from('leave_requests')
    .select('id, employee_id, status')
    .eq('id', id)
    .single()

  if (fetchError || !existing || existing.employee_id !== user.id) {
    return { error: 'Leave request not found.', field: 'general' }
  }

  if (existing.status !== 'pending') {
    return { error: 'Only pending requests can be edited.', field: 'general' }
  }

  const leave_type_id = formData.get('leave_type_id') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const exclude_weekends = formData.get('exclude_weekends') === 'true'
  const reason = (formData.get('reason') as string) || null

  if (!leave_type_id) {
    return { error: 'Please select a leave type.', field: 'leave_type_id' }
  }
  if (!start_date) {
    return { error: 'Please select a start date.', field: 'start_date' }
  }
  if (!end_date) {
    return { error: 'Please select an end date.', field: 'end_date' }
  }

  if (end_date < start_date) {
    return { error: 'End date cannot be before the start date.', field: 'end_date' }
  }

  const days_requested = computeDaysRequested(start_date, end_date, exclude_weekends)

  const { data: leaveType, error: leaveTypeError } = await supabase
    .from('leave_types')
    .select('id')
    .eq('id', leave_type_id)
    .single()

  if (leaveTypeError || !leaveType) {
    return { error: 'Selected leave type could not be found.', field: 'leave_type_id' }
  }

  const { data: overlapping, error: overlapError } = await supabase
    .from('leave_requests')
    .select('id')
    .eq('employee_id', user.id)
    .neq('id', id)
    .in('status', ['pending', 'approved'])
    .lte('start_date', end_date)
    .gte('end_date', start_date)
    .limit(1)

  if (overlapError) {
    return { error: overlapError.message, field: 'general' }
  }
  if (overlapping && overlapping.length > 0) {
    return {
      error: 'This overlaps with an existing pending or approved request.',
      field: 'start_date',
    }
  }

  const { error } = await supabase
    .from('leave_requests')
    .update({ leave_type_id, start_date, end_date, days_requested, reason })
    .eq('id', id)
    .eq('employee_id', user.id)

  if (error) {
    return { error: error.message, field: 'general' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/overview')
  return { error: null }
}

export async function deleteLeaveRequest(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: existing, error: fetchError } = await supabase
    .from('leave_requests')
    .select('id, employee_id, status')
    .eq('id', id)
    .single()

  if (fetchError || !existing || existing.employee_id !== user.id) {
    return { error: 'Leave request not found.' }
  }

  if (existing.status !== 'pending') {
    return { error: 'Only pending requests can be deleted.' }
  }

  const { error } = await supabase
    .from('leave_requests')
    .delete()
    .eq('id', id)
    .eq('employee_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/overview')
  return { error: null }
}

export type LeaveRequestEventRow = {
  id: string
  previous_status: string | null
  new_status: string
  comment: string | null
  created_at: string
  actor_id: string | null
}

export async function getLeaveRequestEvents(
  leaveRequestId: string
): Promise<{ events: LeaveRequestEventRow[]; error?: undefined } | { events?: undefined; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to view this.' }
  }

  const { data: request, error: requestError } = await supabase
    .from('leave_requests')
    .select('id, employee_id')
    .eq('id', leaveRequestId)
    .single()

  if (requestError || !request) {
    return { error: 'Leave request not found.' }
  }

  if (request.employee_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Leave request not found.' }
    }
  }

  const { data: events, error: eventsError } = await supabase
    .from('leave_request_events')
    .select('id, previous_status, new_status, comment, created_at, actor_id')
    .eq('leave_request_id', leaveRequestId)
    .order('created_at', { ascending: true })

  if (eventsError) {
    return { error: eventsError.message }
  }

  return { events: events ?? [] }
}

export type LeaveRequestCommentRow = {
  id: string
  comment: string
  created_at: string
  author_id: string | null
  author: { full_name: string } | { full_name: string }[] | null
}

export async function getLeaveRequestComments(
  leaveRequestId: string
): Promise<
  { comments: LeaveRequestCommentRow[]; error?: undefined } | { comments?: undefined; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to view this.' }
  }

  const { data: request, error: requestError } = await supabase
    .from('leave_requests')
    .select('id, employee_id')
    .eq('id', leaveRequestId)
    .single()

  if (requestError || !request) {
    return { error: 'Leave request not found.' }
  }

  if (request.employee_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Leave request not found.' }
    }
  }

  const { data: comments, error: commentsError } = await supabase
    .from('leave_request_comments')
    .select('id, comment, created_at, author_id, author:profiles!leave_request_comments_author_id_fkey(full_name)')
    .eq('leave_request_id', leaveRequestId)
    .order('created_at', { ascending: true })

  if (commentsError) {
    return { error: commentsError.message }
  }

  return { comments: (comments ?? []) as LeaveRequestCommentRow[] }
}

export async function cancelLeaveRequest(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: existing, error: fetchError } = await supabase
    .from('leave_requests')
    .select('id, employee_id, status, start_date')
    .eq('id', id)
    .single()

  if (fetchError || !existing || existing.employee_id !== user.id) {
    return { error: 'Leave request not found.' }
  }

  if (existing.status !== 'pending' && existing.status !== 'approved') {
    return { error: 'Only pending or approved requests can be cancelled.' }
  }

  if (existing.status === 'approved' && existing.start_date <= todayDateStr()) {
    return { error: 'This request has already started and can no longer be cancelled.' }
  }

  const service = createServiceClient()
  const { data: updated, error } = await service
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('employee_id', user.id)
    .in('status', ['pending', 'approved'])
    .select('id')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!updated) {
    return {
      error: 'This request could not be cancelled — it may have already changed. Refresh and try again.',
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/overview')
  return { error: null }
}
