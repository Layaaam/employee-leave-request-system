'use client'

import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import RequestForm from './RequestForm'

export default function NewRequestButton({
  leaveTypes,
}: {
  leaveTypes: { id: string; name: string; notice_period_days: number | null; requires_documentation: boolean }[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="whitespace-nowrap">
        <IconPlus /> New request
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New leave request</DialogTitle>
        </DialogHeader>
        <RequestForm leaveTypes={leaveTypes} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
