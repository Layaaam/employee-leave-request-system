'use client'

import { useState, useTransition } from 'react'
import { createLeaveType, updateLeaveType } from './actions'

type ExistingLeaveType = {
  id: string
  name: string
  description: string | null
  default_days_allowed: number | null
  is_active: boolean
}

export default function LeaveTypeForm({
  existing,
  onDone,
}: {
  existing?: ExistingLeaveType
  onDone: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = existing
        ? await updateLeaveType(existing.id, formData)
        : await createLeaveType(formData)

      if (result?.error) {
        setError(result.error)
        return
      }
      onDone()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={existing?.name}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={existing?.description ?? ''}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="default_days_allowed" className="block text-sm font-medium text-slate-700 mb-1">
          Default days allowed (leave blank if not applicable, e.g. unpaid leave)
        </label>
        <input
          id="default_days_allowed"
          name="default_days_allowed"
          type="number"
          min={0}
          defaultValue={existing?.default_days_allowed ?? ''}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          defaultChecked={existing?.is_active ?? true}
          className="h-4 w-4 rounded border-slate-300"
        />
        <label htmlFor="is_active" className="text-sm text-slate-700">
          Active (visible to employees)
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} className="text-sm font-medium text-slate-600 px-3 py-2">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="text-sm font-medium bg-slate-900 text-white rounded-md px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : existing ? 'Save changes' : 'Create leave type'}
        </button>
      </div>
    </form>
  )
}
