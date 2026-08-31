'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createLeaveType, updateLeaveType } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

type ExistingLeaveType = {
  id: string
  name: string
  description: string | null
  default_days_allowed: number | null
  is_active: boolean
  notice_period_days: number | null
  requires_documentation: boolean
}

export default function LeaveTypeForm({
  existing,
  onDone,
}: {
  existing?: ExistingLeaveType
  onDone: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(existing?.is_active ?? true)
  const [requiresDocs, setRequiresDocs] = useState(existing?.requires_documentation ?? false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = existing
        ? await updateLeaveType(existing.id, formData)
        : await createLeaveType(formData)

      if (result?.error) {
        setError(result.error)
        toast.error('Could not save leave type', { description: result.error })
        return
      }
      toast.success(existing ? 'Leave type updated' : 'Leave type created')
      onDone()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" type="text" required defaultValue={existing?.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} defaultValue={existing?.description ?? ''} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="default_days_allowed">Default days allowed</Label>
          <Input
            id="default_days_allowed"
            name="default_days_allowed"
            type="number"
            min={0}
            defaultValue={existing?.default_days_allowed ?? ''}
            placeholder="Blank if N/A"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notice_period_days">Notice period (days)</Label>
          <Input
            id="notice_period_days"
            name="notice_period_days"
            type="number"
            min={0}
            defaultValue={existing?.notice_period_days ?? ''}
            placeholder="Blank = no notice needed"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Leave blank for leave types that can be filed after the fact (e.g. Sick Leave). Set a number
        of days for advance-notice types — employees won&apos;t be able to select a start date within
        that window.
      </p>

      <div className="flex items-center gap-2">
        <Checkbox
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked === true)}
        />
        {isActive && <input type="hidden" name="is_active" value="on" />}
        <Label htmlFor="is_active" className="cursor-pointer">
          Active (visible to employees)
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="requires_documentation"
          checked={requiresDocs}
          onCheckedChange={(checked) => setRequiresDocs(checked === true)}
        />
        {requiresDocs && <input type="hidden" name="requires_documentation" value="on" />}
        <Label htmlFor="requires_documentation" className="cursor-pointer">
          Requires supporting documentation
        </Label>
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
          {isPending ? 'Saving…' : existing ? 'Save changes' : 'Create leave type'}
        </Button>
      </div>
    </form>
  )
}
