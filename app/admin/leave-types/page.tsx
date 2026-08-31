import { createClient } from '@/lib/supabase/server'
import LeaveTypeTable from './LeaveTypeTable'
import NewLeaveTypeButton from './NewLeaveTypeButton'

export default async function LeaveTypesPage() {
  const supabase = await createClient()
  const { data: leaveTypes, error } = await supabase.from('leave_types').select('*').order('name')

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold text-foreground">Leave Types</h2>
        <NewLeaveTypeButton />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive mb-4">
          Could not load leave types: {error.message}
        </p>
      )}

      <LeaveTypeTable leaveTypes={leaveTypes ?? []} />
    </div>
  )
}
