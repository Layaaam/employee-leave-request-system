'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createLeaveType(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null
  const rawDays = formData.get('default_days_allowed') as string
  const default_days_allowed = rawDays ? Number(rawDays) : null
  const is_active = formData.get('is_active') === 'on'

  const { error } = await supabase.from('leave_types').insert({
    name,
    description,
    default_days_allowed,
    is_active,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/leave-types')
  return { error: null }
}

export async function updateLeaveType(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null
  const rawDays = formData.get('default_days_allowed') as string
  const default_days_allowed = rawDays ? Number(rawDays) : null
  const is_active = formData.get('is_active') === 'on'

  const { error } = await supabase
    .from('leave_types')
    .update({ name, description, default_days_allowed, is_active })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/leave-types')
  return { error: null }
}

export async function deleteLeaveType(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('leave_types').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      return {
        error:
          'This leave type is used by existing requests and cannot be deleted. Deactivate it instead.',
      }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/leave-types')
  return { error: null }
}
