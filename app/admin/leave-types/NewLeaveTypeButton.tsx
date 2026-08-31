'use client'

import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import LeaveTypeForm from './LeaveTypeForm'

export default function NewLeaveTypeButton() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="whitespace-nowrap">
        <IconPlus /> New leave type
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New leave type</DialogTitle>
        </DialogHeader>
        <LeaveTypeForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
