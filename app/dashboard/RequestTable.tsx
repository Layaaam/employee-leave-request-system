'use client'

import { useState, useTransition } from 'react'
import StatusBadge from './StatusBadge'
import Modal from './Modal'
import RequestForm from './RequestForm'
import { deleteLeaveRequest } from './actions'

type LeaveRequest = {
  id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  review_comment: string | null
  reviewed_at: string | null
  created_at: string
  leave_type_id: string
  leave_type: { id: string; name: string } | null
}

export default function RequestTable({
  requests,
  leaveTypes,
}: {
  requests: LeaveRequest[]
  leaveTypes: { id: string; name: string }[]
}) {
  const [viewing, setViewing] = useState<LeaveRequest | null>(null)
  const [editing, setEditing] = useState<LeaveRequest | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Delete this leave request? This cannot be undone.')) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteLeaveRequest(id)
      setDeletingId(null)
    })
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No leave requests match your filters yet.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Leave type</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Dates</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Days</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-2 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-slate-800">{r.leave_type?.name ?? '—'}</td>
                <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                  {r.start_date} → {r.end_date}
                </td>
                <td className="px-4 py-2 text-slate-600">{r.days_requested}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-2 text-right space-x-3 whitespace-nowrap">
                  <button onClick={() => setViewing(r)} className="text-slate-600 hover:text-slate-900 font-medium">
                    View
                  </button>
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => setEditing(r)} className="text-slate-600 hover:text-slate-900 font-medium">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={isPending && deletingId === r.id}
                        className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      >
                        {isPending && deletingId === r.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <Modal title="Leave request details" onClose={() => setViewing(null)}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Leave type</dt>
              <dd className="text-slate-900 font-medium">{viewing.leave_type?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Dates</dt>
              <dd className="text-slate-900">
                {viewing.start_date} → {viewing.end_date}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Days requested</dt>
              <dd className="text-slate-900">{viewing.days_requested}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <StatusBadge status={viewing.status} />
              </dd>
            </div>
            {viewing.reason && (
              <div>
                <dt className="text-slate-500 mb-1">Reason</dt>
                <dd className="text-slate-900">{viewing.reason}</dd>
              </div>
            )}
            {viewing.review_comment && (
              <div>
                <dt className="text-slate-500 mb-1">Reviewer comment</dt>
                <dd className="text-slate-900">{viewing.review_comment}</dd>
              </div>
            )}
            {viewing.reviewed_at && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Reviewed at</dt>
                <dd className="text-slate-900">{new Date(viewing.reviewed_at).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit leave request" onClose={() => setEditing(null)}>
          <RequestForm
            leaveTypes={leaveTypes}
            existing={{
              id: editing.id,
              leave_type_id: editing.leave_type_id,
              start_date: editing.start_date,
              end_date: editing.end_date,
              days_requested: editing.days_requested,
              reason: editing.reason,
            }}
            onDone={() => setEditing(null)}
          />
        </Modal>
      )}
    </>
  )
}
