'use client'

import { useState, useTransition } from 'react'
import Modal from '@/app/dashboard/Modal'
import LeaveTypeForm from './LeaveTypeForm'
import { deleteLeaveType } from './actions'

type LeaveType = {
  id: string
  name: string
  description: string | null
  default_days_allowed: number | null
  is_active: boolean
}

export default function LeaveTypeTable({ leaveTypes }: { leaveTypes: LeaveType[] }) {
  const [editing, setEditing] = useState<LeaveType | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Delete this leave type? This only works if no requests use it.')) return
    setDeleteError(null)
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteLeaveType(id)
      if (result?.error) {
        setDeleteError(result.error)
      }
      setDeletingId(null)
    })
  }

  if (leaveTypes.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No leave types yet. Create one to get started.
      </div>
    )
  }

  return (
    <>
      {deleteError && (
        <p role="alert" className="text-sm text-red-600 mb-3">
          {deleteError}
        </p>
      )}
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Default days</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-2 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leaveTypes.map((lt) => (
              <tr key={lt.id}>
                <td className="px-4 py-2 text-slate-800">
                  <div className="font-medium">{lt.name}</div>
                  {lt.description && (
                    <div className="text-slate-500 text-xs mt-0.5 max-w-md">{lt.description}</div>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">{lt.default_days_allowed ?? '—'}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      lt.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {lt.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right space-x-3 whitespace-nowrap">
                  <button onClick={() => setEditing(lt)} className="text-slate-600 hover:text-slate-900 font-medium">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(lt.id)}
                    disabled={isPending && deletingId === lt.id}
                    className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                  >
                    {isPending && deletingId === lt.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title="Edit leave type" onClose={() => setEditing(null)}>
          <LeaveTypeForm existing={editing} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </>
  )
}
