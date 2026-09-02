'use client'

import { useState, useTransition, useMemo } from 'react'
import { toast } from 'sonner'
import { createLeaveRequest, updateLeaveRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import DatePicker from './DatePicker'

type LeaveType = {
  id: string
  name: string
  requires_documentation: boolean
}

type ExistingRequest = {
  id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
}

function inclusiveDayCount(start: string, end: string, excludeWeekends: boolean): number | null {
  if (!start || !end) return null
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMs = endDate.getTime() - startDate.getTime()
  if (Number.isNaN(diffMs) || diffMs < 0) return null

  if (!excludeWeekends) {
    return Math.round(diffMs / 86_400_000) + 1
  }

  let count = 0
  const cursor = new Date(startDate)
  while (cursor.getTime() <= endDate.getTime()) {
    const day = cursor.getUTCDay()
    if (day !== 0 && day !== 6) count++
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return count
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
  const [excludeWeekends, setExcludeWeekends] = useState(false)
  const [daysManuallyEdited, setDaysManuallyEdited] = useState(false)
  const [isPending, startTransition] = useTransition()
  const selectedLeaveType = useMemo(
    () => leaveTypes.find((lt) => lt.id === leaveTypeId),
    [leaveTypes, leaveTypeId]
  )

  function recalcDays(start: string, end: string, weekends: boolean) {
    const computed = inclusiveDayCount(start, end, weekends)
    if (computed !== null) setDaysRequested(computed)
  }

  function handleStartChange(next: string) {
    setStartDate(next)
    if (!daysManuallyEdited) recalcDays(next, endDate, excludeWeekends)
  }

  function handleEndChange(next: string) {
    setEndDate(next)
    if (!daysManuallyEdited) recalcDays(startDate, next, excludeWeekends)
  }

  function handleWeekendToggle(checked: boolean) {
    setExcludeWeekends(checked)
    setDaysManuallyEdited(false)
    recalcDays(startDate, endDate, checked)
  }

  function handleRecalculate() {
    setDaysManuallyEdited(false)
    recalcDays(startDate, endDate, excludeWeekends)
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
          <DatePicker value={startDate} onChange={handleStartChange} />
          <input type="hidden" name="start_date" value={startDate} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">End date</Label>
          <DatePicker value={endDate} onChange={handleEndChange} min={startDate || undefined} />
          <input type="hidden" name="end_date" value={endDate} required />
        </div>
      </div>

      {selectedLeaveType?.requires_documentation && (
        <p className="text-xs text-muted-foreground -mt-2">
          Supporting documentation for {selectedLeaveType.name} will need to be submitted separately.
        </p>
      )}

      <div className="flex items-center gap-2">
        <Checkbox
          id="exclude_weekends"
          checked={excludeWeekends}
          onCheckedChange={(checked) => handleWeekendToggle(checked === true)}
        />
        <Label htmlFor="exclude_weekends" className="cursor-pointer text-sm">
          Exclude weekends from day count
        </Label>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="days_requested">Days requested</Label>
          {daysManuallyEdited && (
            <button
              type="button"
              onClick={handleRecalculate}
              className="text-xs text-primary underline underline-offset-2"
            >
              Recalculate from dates
            </button>
          )}
        </div>
        <Input
          id="days_requested"
          name="days_requested"
          type="number"
          min={1}
          required
          value={daysRequested}
          onChange={(e) => {
            setDaysManuallyEdited(true)
            setDaysRequested(e.target.value === '' ? '' : Number(e.target.value))
          }}
        />
        <p className="text-xs text-muted-foreground">
          {daysManuallyEdited
            ? 'Manually set — changing the dates will no longer overwrite this.'
            : 'Auto-calculated from the selected dates. Type a new value to override.'}
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
