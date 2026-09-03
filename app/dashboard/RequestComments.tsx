'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getLeaveRequestComments, type LeaveRequestCommentRow } from './actions'
import { addLeaveRequestComment } from '@/app/admin/actions'
import { formatDateTime } from '@/lib/utils'

function authorName(author: LeaveRequestCommentRow['author']): string {
  if (!author) return 'Admin'
  const a = Array.isArray(author) ? author[0] : author
  return a?.full_name ?? 'Admin'
}

const COMMENT_TRUNCATE_LENGTH = 120
const COMMENT_MAX_LENGTH = 2000

function CommentBody({ comment }: { comment: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = comment.length > COMMENT_TRUNCATE_LENGTH
  const displayText =
    isLong && !expanded ? `${comment.slice(0, COMMENT_TRUNCATE_LENGTH).trimEnd()}…` : comment

  return (
    <div className="mt-0.5 min-w-0 text-muted-foreground">
      <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
        {displayText}
      </span>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="ml-1 font-medium text-foreground underline underline-offset-2 hover:no-underline"
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  )
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

      if (result.comments) {
        setComments(result.comments)
      } else {
        setError(result.error)
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

    const result = await addLeaveRequestComment(
      leaveRequestId,
      trimmed
    )

    setSubmitting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setDraft('')

    const refreshed = await getLeaveRequestComments(leaveRequestId)

    if (refreshed.comments) {
      setComments(refreshed.comments)
    }

    toast.success('Comment added')
  }

  return (
    <div className="min-w-0 space-y-3 rounded-md border border-border bg-card px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Comments
      </p>

      {error && (
        <p className="text-xs text-destructive">
          Could not load comments: {error}
        </p>
      )}

      {comments === null && !error && (
        <p className="text-xs text-muted-foreground">
          Loading comments...
        </p>
      )}

      {comments !== null && comments.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No comments yet.
        </p>
      )}

      {comments !== null && comments.length > 0 && (
        <ul className="min-w-0 space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="min-w-0 text-xs"
            >
              <p className="font-medium text-foreground">
                {authorName(c.author)}
              </p>

              <CommentBody comment={c.comment} />

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
            onChange={(e) => setDraft(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
            placeholder="Add a comment for the employee to see (e.g. request a document)..."
            rows={2}
            maxLength={COMMENT_MAX_LENGTH}
            className="[overflow-wrap:anywhere]"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className={`text-[11px] tabular-nums ${
                draft.length >= COMMENT_MAX_LENGTH
                  ? 'text-destructive'
                  : 'text-muted-foreground/70'
              }`}
            >
              {draft.length}/{COMMENT_MAX_LENGTH}
            </p>

            <Button
              size="sm"
              onClick={handleAdd}
              disabled={submitting || !draft.trim()}
            >
              {submitting ? 'Adding...' : 'Add comment'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}