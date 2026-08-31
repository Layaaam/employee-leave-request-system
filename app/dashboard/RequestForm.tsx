'use client'

import { useState, useTransition, useMemo } from 'react'
import { toast } from 'sonner'
import { createLeaveRequest, updateLeaveRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type LeaveType = { id: string; name: string }

type ExistingRequest = {
  id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
}

const RETROACTIVE_ALLOWED = ['Sick Leave', 'Emergency/Bereavement Leave']

function todayStr(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function inclusiveDayCount(start: string, end: string): number | null {
  if (!start || !end) return null
  const diffMs = new Date(end).getTime() - new Date(start).getTime()
  if (Number.isNaN(diffMs) || diffMs < 0) return null
  return Math.round(diffMs / 86_400_000) + 1
}

export default function RequestForm({
  leaveTypes,
  existing,
  onDone,
}: {
  leaveTypes: LeaveType[]
  existing?: ExistingRequest
  onDone: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [leaveTypeId, setLeaveTypeId] = useState(existing?.leave_type_id ?? '')
  const [startDate, setStartDate] = useState(existing?.start_date ?? '')
  const [endDate, setEndDate] = useState(existing?.end_date ?? '')
  const [daysRequested, setDaysRequested] = useState<number | ''>(existing?.days_requested ?? '')
  const [isPending, startTransition] = useTransition()

  const selectedLeaveTypeName = useMemo(
    () => leaveTypes.find((lt) => lt.id === leaveTypeId)?.name,
    [leaveTypes, leaveTypeId]
  )
  const allowsPastDates = selectedLeaveTypeName
    ? RETROACTIVE_ALLOWED.includes(selectedLeaveTypeName)
    : false
  const minStartDate = allowsPastDates ? undefined : todayStr()

  function handleDateChange(nextStart: string, nextEnd: string) {
    setStartDate(nextStart)
    setEndDate(nextEnd)
    const computed = inclusiveDayCount(nextStart, nextEnd)
    if (computed !== null) {
      setDaysRequested(computed)
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = existing
        ? await updateLeaveRequest(existing.id, formData)
        : await createLeaveRequest(formData)

      if (result?.error) {
        setError(result.error)
        toast.error('Could not save request', { description: result.error })
        return
      }
      toast.success(existing ? 'Request updated' : 'Request submitted')
      onDone()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="leave_type_id">Leave type</Label>
        <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
          <SelectTrigger id="leave_type_id">
            <SelectValue placeholder="Select a leave type" />
          </SelectTrigger>
          <SelectContent>
            {leaveTypes.map((lt) => (
              <SelectItem key={lt.id} value={lt.id}>
                {lt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="leave_type_id" value={leaveTypeId} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            required
            min={minStartDate}
            value={startDate}
            onChange={(e) => handleDateChange(e.target.value, endDate)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">End date</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            required
            min={startDate || minStartDate}
            value={endDate}
            onChange={(e) => handleDateChange(startDate, e.target.value)}
          />
        </div>
      </div>

      {selectedLeaveTypeName && (
        <p className="text-xs text-muted-foreground -mt-2">
          {allowsPastDates
            ? `${selectedLeaveTypeName} can be filed for dates already passed, consistent with common practice for urgent leave.`
            : `${selectedLeaveTypeName} requires advance notice, so past dates aren't selectable.`}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="days_requested">Days requested</Label>
        <Input
          id="days_requested"
          name="days_requested"
          type="number"
          min={1}
          required
          value={daysRequested}
          onChange={(e) => setDaysRequested(e.target.value === '' ? '' : Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Auto-calculated from the selected dates (inclusive). Adjust manually if needed, e.g. for a half-day.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Textarea id="reason" name="reason" rows={3} defaultValue={existing?.reason ?? ''} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : existing ? 'Save changes' : 'Submit request'}
        </Button>
      </div>
    </form>
  )
}
