'use client'

import { useEffect, useState } from 'react'
import { getLeaveRequestEvents } from '../actions'

export type LeaveRequestEvent = {
  id: string
  previous_status: string | null
  new_status: string
  comment: string | null
  created_at: string
  actor_id: string | null
}

export default function EventTimeline({
  leaveRequestId,
  initialEvents,
}: {
  leaveRequestId: string
  initialEvents?: LeaveRequestEvent[]
}) {
  const [events, setEvents] = useState<LeaveRequestEvent[] | null>(initialEvents ?? null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialEvents !== undefined) {
      return
    }

    let cancelled = false
    async function load() {
      const result = await getLeaveRequestEvents(leaveRequestId)

      if (cancelled) return
      if (result.events) {
        setEvents(result.events)
      } else {
        setError(result.error)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [leaveRequestId, initialEvents])

  if (error) {
    return <p className="text-xs text-destructive">Could not load history: {error}</p>
  }

  if (events === null) {
    return (
      <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">Loading history...</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card px-3 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">History</p>
        <p className="mt-1 text-xs text-muted-foreground">No status changes recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-card px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">History</p>
      <ul className="space-y-3">
        {events.map((e) => (
          <li key={e.id} className="flex gap-3 text-xs text-muted-foreground">
            <span className="mt-1 size-2 rounded-full bg-primary/70" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-foreground">
                {e.previous_status ? `${e.previous_status} -> ${e.new_status}` : `Created as ${e.new_status}`}
              </span>
              {e.comment && <span className="mt-1 block italic">&ldquo;{e.comment}&rdquo;</span>}
            </span>
            <span className="whitespace-nowrap">{new Date(e.created_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
