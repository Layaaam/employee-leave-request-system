'use client'

import { useState, useTransition } from 'react'
import { createLeaveRequest, updateLeaveRequest } from './actions'

type LeaveType = { id: string; name: string }

type ExistingRequest = {
  id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
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
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = existing
        ? await updateLeaveRequest(existing.id, formData)
        : await createLeaveRequest(formData)

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
        <label htmlFor="leave_type_id" className="block text-sm font-medium text-slate-700 mb-1">
          Leave type
        </label>
        <select
          id="leave_type_id"
          name="leave_type_id"
          required
          defaultValue={existing?.leave_type_id ?? ''}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a leave type
          </option>
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-slate-700 mb-1">
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={existing?.start_date}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-slate-700 mb-1">
            End date
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            defaultValue={existing?.end_date}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="days_requested" className="block text-sm font-medium text-slate-700 mb-1">
          Days requested
        </label>
        <input
          id="days_requested"
          name="days_requested"
          type="number"
          min={1}
          required
          defaultValue={existing?.days_requested}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">
          Reason (optional)
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          defaultValue={existing?.reason ?? ''}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
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
          {isPending ? 'Saving…' : existing ? 'Save changes' : 'Submit request'}
        </button>
      </div>
    </form>
  )
}
