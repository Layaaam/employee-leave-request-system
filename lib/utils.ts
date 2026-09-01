import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formats a plain 'YYYY-MM-DD' date string (as stored/returned by Postgres
// date columns) into a human-readable form, e.g. "August 5, 2026".
// Explicitly uses UTC to avoid an off-by-one-day shift that occurs in
// negative-UTC-offset timezones when parsing a date-only string.
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateStr))
}

// Compact form for table rows, e.g. "Aug 31, 2026". Same UTC-forcing as
// formatDate above, for the same reason (avoids off-by-one on date-only
// columns).
export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateStr))
}

// For timestamptz columns (already carries real time+timezone info, e.g.
// reviewed_at) — no UTC-forcing needed here, unlike the date-only helpers
// above.
export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(dateStr))
}

