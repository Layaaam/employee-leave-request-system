'use client'

import { useState } from 'react'
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
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
  placeholder = 'Select date',
}: {
  value: string
  onChange: (value: string) => void
  min?: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => (value ? parseLocalDate(value) : new Date()))

  const minDate = min ? parseLocalDate(min) : null
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  function isDisabled(d: Date) {
    if (!minDate) return false
    return d.getTime() < minDate.getTime()
  }
  function isSelected(d: Date) {
    return value === toDateStr(d)
  }
  function isToday(d: Date) {
    const t = new Date()
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* justify-between guarantees the icon sits at the far right,
            regardless of how long the formatted date text is. */}
        <Button type="button" variant="outline" className="w-full justify-between font-normal">
          <span className={cn(!value && 'text-muted-foreground')}>
            {value ? formatDisplay(value) : placeholder}
          </span>
          <IconCalendar className="text-muted-foreground" />
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
