'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function BulkRejectModal({
  ids,
  onClose,
}: {
  ids: string[]
  onClose: () => void
}) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleReject() {
    startTransition(async () => {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/leave-requests/${id}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ review_comment: comment || null }),
          }).then((res) => {
            if (!res.ok) throw new Error('failed')
          })
        )
      )
      const failed = results.filter((r) => r.status === 'rejected').length
      const succeeded = ids.length - failed

      if (succeeded > 0) {
        toast.success(`${succeeded} request${succeeded === 1 ? '' : 's'} rejected`)
      }
      if (failed > 0) {
        toast.error(`${failed} request${failed === 1 ? '' : 's'} could not be rejected`)
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject {ids.length} request{ids.length === 1 ? '' : 's'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This comment will be applied to all {ids.length} selected requests.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="bulk_comment">Comment (optional)</Label>
            <Textarea
              id="bulk_comment"
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
              {isPending ? 'Rejecting…' : `Reject ${ids.length}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
