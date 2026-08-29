'use client'

import Modal from '@/app/dashboard/Modal'

export default function RejectModal({
  request,
  onClose,
}: {
  request: { id: string; employee: { full_name: string } | null }
  onClose: () => void
}) {
  return (
    <Modal title="Reject leave request" onClose={onClose}>
      <form action={`/api/leave-requests/${request.id}/reject`} method="POST" className="space-y-4">
        <p className="text-sm text-slate-600">
          Rejecting {request.employee?.full_name ?? 'this employee'}&apos;s request. You can add a
          comment explaining why (optional).
        </p>
        <div>
          <label htmlFor="review_comment" className="block text-sm font-medium text-slate-700 mb-1">
            Comment (optional)
          </label>
          <textarea
            id="review_comment"
            name="review_comment"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-600 px-3 py-2">
            Cancel
          </button>
          <button
            type="submit"
            className="text-sm font-medium bg-red-600 text-white rounded-md px-4 py-2 hover:bg-red-700"
          >
            Reject request
          </button>
        </div>
      </form>
    </Modal>
  )
}
