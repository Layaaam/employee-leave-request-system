'use client'

import { useState, useTransition, useMemo } from 'react'
import { toast } from 'sonner'
import { createLeaveRequest, updateLeaveRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
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

type FieldName = 'leave_type_id' | 'start_date' | 'end_date' | 'general'

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
  const [errorField, setErrorField] = useState<FieldName | null>(null)
  const [leaveTypeId, setLeaveTypeId] = useState(existing?.leave_type_id ?? '')
  const [startDate, setStartDate] = useState(existing?.start_date ?? '')
  const [endDate, setEndDate] = useState(existing?.end_date ?? '')
  const [excludeWeekends, setExcludeWeekends] = useState(false)
  const [isPending, startTransition] = useTransition()
  const selectedLeaveType = useMemo(
    () => leaveTypes.find((lt) => lt.id === leaveTypeId),
    [leaveTypes, leaveTypeId]
  )

  const daysRequested = useMemo(
    () => inclusiveDayCount(startDate, endDate, excludeWeekends),
    [startDate, endDate, excludeWeekends]
  )

  function clearFieldError(field: FieldName) {
    if (errorField === field) {
      setError(null)
      setErrorField(null)
    }
  }

  function handleStartChange(next: string) {
    setStartDate(next)
    clearFieldError('start_date')
  }

  function handleEndChange(next: string) {
    setEndDate(next)
    clearFieldError('end_date')
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    setErrorField(null)

    if (!leaveTypeId) {
      setError('Please select a leave type.')
      setErrorField('leave_type_id')
      return
    }
    if (!startDate) {
      setError('Please select a start date.')
      setErrorField('start_date')
      return
    }
    if (!endDate) {
      setError('Please select an end date.')
      setErrorField('end_date')
      return
    }
    if (endDate < startDate) {
      setError('End date cannot be before the start date.')
      setErrorField('end_date')
      return
    }

    startTransition(async () => {
      const result = existing
        ? await updateLeaveRequest(existing.id, formData)
        : await createLeaveRequest(formData)

      if (result?.error) {
        setError(result.error)
        setErrorField((result as { field?: FieldName }).field ?? 'general')
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
        <Select
          value={leaveTypeId}
          onValueChange={(v) => {
            setLeaveTypeId(v)
            clearFieldError('leave_type_id')
          }}
        >
          <SelectTrigger id="leave_type_id" className={cn(errorField === 'leave_type_id' && 'border-destructive')}>
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
        {errorField === 'leave_type_id' && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start date</Label>
          <DatePicker
            value={startDate}
            onChange={handleStartChange}
            className={cn(errorField === 'start_date' && 'border-destructive')}
          />
          <input type="hidden" name="start_date" value={startDate} required />
          {errorField === 'start_date' && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">End date</Label>
          <DatePicker
            value={endDate}
            onChange={handleEndChange}
            min={startDate || undefined}
            className={cn(errorField === 'end_date' && 'border-destructive')}
          />
          <input type="hidden" name="end_date" value={endDate} required />
          {errorField === 'end_date' && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
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
          onCheckedChange={(checked) => setExcludeWeekends(checked === true)}
        />
        <Label htmlFor="exclude_weekends" className="cursor-pointer text-sm">
          Exclude weekends from day count
        </Label>
        <input type="hidden" name="exclude_weekends" value={excludeWeekends ? 'true' : 'false'} />
      </div>

      <div className="space-y-1.5">
        <Label>Days requested</Label>
        <div className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-foreground">
          {daysRequested !== null ? daysRequested : '—'}
        </div>
        <p className="text-xs text-muted-foreground">
          Calculated automatically from the selected dates
          {excludeWeekends ? ' (weekends excluded)' : ''}.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Textarea id="reason" name="reason" rows={3} defaultValue={existing?.reason ?? ''} />
      </div>

      {error && errorField === 'general' && (
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
