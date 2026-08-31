'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Event = {
  id: string
  previous_status: string | null
  new_status: string
  comment: string | null
  created_at: string
  actor_id: string | null
}

export default function EventTimeline({ leaveRequestId }: { leaveRequestId: string }) {
  const [events, setEvents] = useState<Event[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leave_request_events')
        .select('id, previous_status, new_status, comment, created_at, actor_id')
        .eq('leave_request_id', leaveRequestId)
        .order('created_at', { ascending: true })

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setEvents(data)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [leaveRequestId])

  if (error) {
    return <p className="text-xs text-destructive">Could not load history: {error}</p>
  }

  if (!events) {
    return <p className="text-xs text-muted-foreground">Loading history…</p>
  }

  if (events.length === 0) {
    return null
  }

  return (
    <div className="pt-2 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">History</p>
      <ul className="space-y-2">
        {events.map((e) => (
          <li key={e.id} className="text-xs text-muted-foreground flex justify-between gap-2">
            <span>
              {e.previous_status ? `${e.previous_status} → ${e.new_status}` : `Created as ${e.new_status}`}
              {e.comment && <span className="italic"> — &ldquo;{e.comment}&rdquo;</span>}
            </span>
            <span className="whitespace-nowrap">{new Date(e.created_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
