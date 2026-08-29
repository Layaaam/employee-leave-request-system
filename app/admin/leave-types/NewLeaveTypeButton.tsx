'use client'

import { useState } from 'react'
import Modal from '@/app/dashboard/Modal'
import LeaveTypeForm from './LeaveTypeForm'

export default function NewLeaveTypeButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium bg-slate-900 text-white rounded-md px-4 py-2 hover:bg-slate-800 whitespace-nowrap"
      >
        New leave type
      </button>
      {open && (
        <Modal title="New leave type" onClose={() => setOpen(false)}>
          <LeaveTypeForm onDone={() => setOpen(false)} />
        </Modal>
      )}
    </>
  )
}
