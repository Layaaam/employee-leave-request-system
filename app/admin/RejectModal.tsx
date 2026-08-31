'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function RejectModal({
  request,
  onClose,
}: {
  request: { id: string; employee: { full_name: string } | null }
  onClose: () => void
}) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleReject() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/leave-requests/${request.id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ review_comment: comment || null }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error('Could not reject request', { description: data.error })
          return
        }
        toast.success('Request rejected')
        router.refresh()
        onClose()
      } catch {
        toast.error('Could not reject request', { description: 'Network error — please try again.' })
      }
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject leave request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Rejecting {request.employee?.full_name ?? 'this employee'}&apos;s request. You can add a
            comment explaining why (optional).
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="review_comment">Comment (optional)</Label>
            <Textarea
              id="review_comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleReject} disabled={isPending}>
              {isPending ? 'Rejecting…' : 'Reject request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
