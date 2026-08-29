'use client'

import { useState } from 'react'
import StatusBadge from '@/app/dashboard/StatusBadge'
import Modal from '@/app/dashboard/Modal'
import RejectModal from './RejectModal'

type Person = { id: string; full_name: string } | null

type AdminLeaveRequest = {
  id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  review_comment: string | null
  reviewed_at: string | null
  created_at: string
  leave_type: { id: string; name: string } | null
  employee: Person
  reviewer: Person
}

export default function AdminRequestTable({ requests }: { requests: AdminLeaveRequest[] }) {
  const [viewing, setViewing] = useState<AdminLeaveRequest | null>(null)
  const [rejecting, setRejecting] = useState<AdminLeaveRequest | null>(null)

  if (requests.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No leave requests match your filters.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Employee</th>
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
                <td className="px-4 py-2 text-slate-800">{r.employee?.full_name ?? '—'}</td>
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
                      <form
                        action={`/api/leave-requests/${r.id}/approve`}
                        method="POST"
                        className="inline"
                      >
                        <button type="submit" className="text-emerald-700 hover:text-emerald-900 font-medium">
                          Approve
                        </button>
                      </form>
                      <button
                        onClick={() => setRejecting(r)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Reject
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
              <dt className="text-slate-500">Employee</dt>
              <dd className="text-slate-900 font-medium">{viewing.employee?.full_name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Leave type</dt>
              <dd className="text-slate-900">{viewing.leave_type?.name ?? '—'}</dd>
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
            {viewing.reviewer && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Reviewed by</dt>
                <dd className="text-slate-900">{viewing.reviewer.full_name}</dd>
              </div>
            )}
            {viewing.reviewed_at && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Reviewed at</dt>
                <dd className="text-slate-900">{new Date(viewing.reviewed_at).toLocaleString()}</dd>
              </div>
            )}
            {viewing.review_comment && (
              <div>
                <dt className="text-slate-500 mb-1">Reviewer comment</dt>
                <dd className="text-slate-900">{viewing.review_comment}</dd>
              </div>
            )}
          </dl>
        </Modal>
      )}

      {rejecting && <RejectModal request={rejecting} onClose={() => setRejecting(null)} />}
    </>
  )
}
