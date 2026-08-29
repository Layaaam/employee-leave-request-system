'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// No manual role check needed in any of these — the Phase 1 RLS policies
// (leave_types_insert_admin / update_admin / delete_admin) already restrict
// these writes to role = 'admin'. A non-admin invoking these gets a
// Postgres-level rejection, not just a UI-level one.

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
    // Postgres foreign key violation (leave_requests.leave_type_id has
    // ON DELETE RESTRICT — see Phase 1 schema): surface a clear message
    // instead of a raw DB error, and point at the is_active toggle as
    // the intended way to retire a leave type still referenced by history.
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
