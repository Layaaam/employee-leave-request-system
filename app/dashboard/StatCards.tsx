import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function StatCards({
  pending,
  approved,
  rejected,
  links,
  activeStatus,
}: {
  pending: number
  approved: number
  rejected: number
  links?: Partial<Record<'pending' | 'approved' | 'rejected', string>>
  activeStatus?: string
}) {
  const items = [
    { key: 'pending' as const, label: 'Pending', value: pending, dot: 'bg-amber-400' },
    { key: 'approved' as const, label: 'Approved', value: approved, dot: 'bg-emerald-400' },
    { key: 'rejected' as const, label: 'Rejected', value: rejected, dot: 'bg-rose-400' },
  ]

  return (
    <div className="mb-6 flex flex-col gap-px overflow-hidden rounded-xl border border-border bg-border sm:flex-row">
      {items.map((item) => {
        const href = links?.[item.key]
        const isActive = activeStatus === item.key
        const content = (
          <div
            className={cn(
              'flex flex-1 items-center gap-3 bg-card px-5 py-4 transition-colors',
              href && 'hover:bg-accent/40',
              isActive && 'bg-accent/60'
            )}
          >
            <span className={cn('size-2 rounded-full', item.dot)} aria-hidden />
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="ml-auto text-xl font-semibold tabular-nums text-foreground">
              {item.value}
            </span>
          </div>
        )

        return href ? (
          <Link key={item.key} href={href} className="flex flex-1">
            {content}
          </Link>
        ) : (
          <div key={item.key} className="flex flex-1">
            {content}
          </div>
        )
      })}
    </div>
  )
}
