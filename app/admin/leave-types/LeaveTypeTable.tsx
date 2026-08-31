'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const [deleting, setDeleting] = useState<LeaveType | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleting) return
    const id = deleting.id
    startTransition(async () => {
      const result = await deleteLeaveType(id)
      if (result?.error) {
        toast.error('Could not delete leave type', { description: result.error })
      } else {
        toast.success('Leave type deleted')
      }
      setDeleting(null)
    })
  }

  if (leaveTypes.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No leave types yet. Create one to get started.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Default days</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leaveTypes.map((lt) => (
              <tr key={lt.id}>
                <td className="px-4 py-2 text-foreground">
                  <div className="font-medium">{lt.name}</div>
                  {lt.description && (
                    <div className="text-muted-foreground text-xs mt-0.5 max-w-md">{lt.description}</div>
                  )}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{lt.default_days_allowed ?? '—'}</td>
                <td className="px-4 py-2">
                  <Badge variant={lt.is_active ? 'approved' : 'cancelled'}>
                    {lt.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-right space-x-1 whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(lt)}>
                    <IconPencil /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleting(lt)}
                  >
                    <IconTrash /> Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit leave type</DialogTitle>
          </DialogHeader>
          {editing && <LeaveTypeForm existing={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this leave type?</AlertDialogTitle>
            <AlertDialogDescription>
              This only works if no requests currently use it. If it&apos;s in use, deactivate it
              instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
