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
  return { error: null }
}

export async function updateLeaveRequest(id: string, formData: FormData) {
  const supabase = await createClient()

  const leave_type_id = formData.get('leave_type_id') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const days_requested = Number(formData.get('days_requested'))
  const reason = (formData.get('reason') as string) || null

  // No manual ownership/status check needed here — RLS (Phase 1) already
  // restricts this update to the caller's own rows while status = 'pending'.
  // If the row isn't eligible, Postgres returns zero rows affected / an error.
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
