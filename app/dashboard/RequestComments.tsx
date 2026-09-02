'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getLeaveRequestComments, type LeaveRequestCommentRow } from './actions'
import { addLeaveRequestComment } from '@/app/admin/actions'
import { formatDateTime, cn } from '@/lib/utils'

function authorName(author: LeaveRequestCommentRow['author']): string {
  if (!author) return 'Admin'
  const a = Array.isArray(author) ? author[0] : author
  return a?.full_name ?? 'Admin'
}

export default function RequestComments({
  leaveRequestId,
  canAdd,
}: {
  leaveRequestId: string
  canAdd: boolean
}) {
  const [comments, setComments] = useState<LeaveRequestCommentRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const result = await getLeaveRequestComments(leaveRequestId)
      if (cancelled) return
      if (result.error) {
        setError(result.error)
      } else {
        setComments(result.comments)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [leaveRequestId])

  async function handleAdd() {
    const trimmed = draft.trim()
    if (!trimmed) return

    setSubmitting(true)
    const result = await addLeaveRequestComment(leaveRequestId, trimmed)
    setSubmitting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setDraft('')
    const refreshed = await getLeaveRequestComments(leaveRequestId)
    if (!refreshed.error) {
      setComments(refreshed.comments)
    }
    toast.success('Comment added')
  }

  return (
    <div className="rounded-md border border-border bg-card px-3 py-3 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Comments</p>

      {error && <p className="text-xs text-destructive">Could not load comments: {error}</p>}

      {comments === null && !error && (
        <p className="text-xs text-muted-foreground">Loading comments...</p>
      )}

      {comments !== null && comments.length === 0 && (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      )}

      {comments !== null && comments.length > 0 && (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="text-xs">
              <p className="font-medium text-foreground">{authorName(c.author)}</p>
              <p className="mt-0.5 text-muted-foreground">{c.comment}</p>
              <p className="mt-0.5 text-muted-foreground/70">
                {formatDateTime(c.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
      {canAdd && (
        <div className="space-y-2 pt-1">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment for the employee to see (e.g. request a document)..."
            rows={2}
            maxLength={2000}
          />
          <Button size="sm" onClick={handleAdd} disabled={submitting || !draft.trim()}>
            {submitting ? 'Adding...' : 'Add comment'}
          </Button>
        </div>
      )}
    </div>
  )
}
