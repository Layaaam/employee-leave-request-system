'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function createLeaveRequest(formData: FormData) {
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
  const days_requested = Number(formData.get('days_requested'))
  const reason = (formData.get('reason') as string) || null

  if (!leave_type_id || !start_date || !end_date) {
    return { error: 'Leave type, start date, and end date are required.' }
  }

  if (end_date < start_date) {
    return { error: 'End date cannot be before the start date.' }
  }

  if (!Number.isFinite(days_requested) || days_requested < 1) {
    return { error: 'Days requested must be at least 1.' }
  }

  const { data: leaveType, error: leaveTypeError } = await supabase
    .from('leave_types')
    .select('name, default_days_allowed')
    .eq('id', leave_type_id)
    .single()

  if (leaveTypeError || !leaveType) {
    return { error: 'Selected leave type could not be found.' }
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
    return { error: overlapError.message }
  }
  if (overlapping && overlapping.length > 0) {
    return { error: 'This overlaps with an existing pending or approved request.' }
  }

  if (leaveType.default_days_allowed !== null) {
    const currentYear = new Date().getFullYear()
    const { data: existingForType, error: usageError } = await supabase
      .from('leave_requests')
      .select('days_requested')
      .eq('employee_id', user.id)
      .eq('leave_type_id', leave_type_id)
      .in('status', ['pending', 'approved'])
      .gte('start_date', `${currentYear}-01-01`)
      .lte('start_date', `${currentYear}-12-31`)

    if (usageError) {
      return { error: usageError.message }
    }

    const alreadyCommitted = (existingForType ?? []).reduce(
      (sum, r) => sum + r.days_requested,
      0
    )
    const remaining = leaveType.default_days_allowed - alreadyCommitted

    if (days_requested > remaining) {
      return {
        error: `Only ${Math.max(remaining, 0)} day${remaining === 1 ? '' : 's'} remaining for ${leaveType.name} this year.`,
      }
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
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/overview')
  return { error: null }
}

export async function updateLeaveRequest(id: string, formData: FormData) {
  const supabase = await createClient()

  const leave_type_id = formData.get('leave_type_id') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const days_requested = Number(formData.get('days_requested'))
  const reason = (formData.get('reason') as string) || null
  const { error } = await supabase
    .from('leave_requests')
    .update({ leave_type_id, start_date, end_date, days_requested, reason })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { error: null }
}

export async function deleteLeaveRequest(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('leave_requests').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { error: null }
}
