'use client'

import { useState } from 'react'
import Modal from './Modal'
import RequestForm from './RequestForm'

export default function NewRequestButton({
  leaveTypes,
}: {
  leaveTypes: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium bg-slate-900 text-white rounded-md px-4 py-2 hover:bg-slate-800 whitespace-nowrap"
      >
        New request
      </button>
      {open && (
        <Modal title="New leave request" onClose={() => setOpen(false)}>
          <RequestForm leaveTypes={leaveTypes} onDone={() => setOpen(false)} />
        </Modal>
      )}
    </>
  )
}
