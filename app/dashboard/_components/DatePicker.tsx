'use client'

import { useState } from 'react'
import { IconCalendar, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toDateStr(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatDisplay(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  clearable = false,
  className,
}: {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  clearable?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => (value ? parseLocalDate(value) : new Date()))

  const minDate = min ? parseLocalDate(min) : null
  const maxDate = max ? parseLocalDate(max) : null
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  function isDisabled(d: Date) {
    if (minDate && d.getTime() < minDate.getTime()) return true
    if (maxDate && d.getTime() > maxDate.getTime()) return true
    return false
  }
  function isSelected(d: Date) {
    return value === toDateStr(d)
  }
  function isToday(d: Date) {
    const t = new Date()
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
  }
  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setViewDate(value ? parseLocalDate(value) : new Date())
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ? formatDisplay(value) : placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {clearable && value && (
              <span
                role="button"
                aria-label="Clear date"
                tabIndex={0}
                className="flex items-center rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onChange('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    e.preventDefault()
                    onChange('')
                  }
                }}
              >
                <IconX size={16} />
              </span>
            )}
            <IconCalendar className="text-muted-foreground" size={16} />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex items-center justify-between mb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
          >
            <IconChevronLeft />
          </Button>
          <p className="text-sm font-medium text-foreground">
            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
          >
            <IconChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) =>
            d ? (
              <button
                key={i}
                type="button"
                disabled={isDisabled(d)}
                onClick={() => {
                  onChange(toDateStr(d))
                  setOpen(false)
                }}
                className={cn(
                  'h-8 w-8 rounded-md text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-transparent',
                  isSelected(d) && 'bg-primary text-primary-foreground hover:bg-primary',
                  !isSelected(d) && isToday(d) && 'border border-primary text-primary'
                )}
              >
                {d.getDate()}
              </button>
            ) : (
              <div key={i} />
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
