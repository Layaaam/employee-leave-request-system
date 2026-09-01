import { IconCircleCheck, IconCircleX, IconClockHour4 } from '@tabler/icons-react'

export default function StatCards({
  pending,
  approved,
  rejected,
}: {
  pending: number
  approved: number
  rejected: number
}) {
  const cards = [
    {
      label: 'Pending',
      value: pending,
      icon: IconClockHour4,
      className: 'border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50',
      iconClassName: 'bg-violet-100 text-violet-600',
      valueClassName: 'text-violet-700',
    },
    {
      label: 'Approved',
      value: approved,
      icon: IconCircleCheck,
      className: 'border-emerald-100 bg-gradient-to-br from-white to-emerald-50',
      iconClassName: 'bg-emerald-100 text-emerald-600',
      valueClassName: 'text-emerald-700',
    },
    {
      label: 'Rejected',
      value: rejected,
      icon: IconCircleX,
      className: 'border-rose-100 bg-gradient-to-br from-white to-rose-50',
      iconClassName: 'bg-rose-100 text-rose-600',
      valueClassName: 'text-rose-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={`rounded-lg border p-4 shadow-sm shadow-violet-100/40 ${card.className}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className={`mt-2 text-3xl font-semibold leading-none ${card.valueClassName}`}>
                  {card.value}
                </p>
              </div>
              <span className={`grid size-10 place-items-center rounded-md ${card.iconClassName}`}>
                <Icon className="size-5" />
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
