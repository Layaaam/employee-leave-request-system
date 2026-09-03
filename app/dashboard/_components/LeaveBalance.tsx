type LeaveType = { id: string; name: string; default_days_allowed: number | null }
type Usage = Record<string, number>

export default function LeaveBalance({
  leaveTypes,
  usage,
  pending,
}: {
  leaveTypes: LeaveType[]
  usage: Usage
  pending?: Usage
}) {
  const withLimits = leaveTypes.filter((lt) => lt.default_days_allowed !== null)
  if (withLimits.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {withLimits.map((lt) => {
        const used = usage[lt.id] ?? 0
        const pendingDays = pending?.[lt.id] ?? 0
        const total = lt.default_days_allowed ?? 0
        const remaining = Math.max(total - used - pendingDays, 0)
        const usedPct = total > 0 ? Math.min((used / total) * 100, 100) : 0
        const pendingPct = total > 0 ? Math.min((pendingDays / total) * 100, 100 - usedPct) : 0
        return (
          <div key={lt.id} className="rounded-lg border border-border bg-card p-4 shadow-sm shadow-violet-100/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{lt.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{total} annual credits</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold leading-none text-foreground">{remaining}</p>
                <p className="mt-1 text-xs text-muted-foreground">remaining</p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="flex h-full">
                <div className="bg-primary" style={{ width: `${usedPct}%` }} />
                <div className="bg-amber-300" style={{ width: `${pendingPct}%` }} />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Used</p>
                <p className="font-medium text-foreground">{used}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pending</p>
                <p className="font-medium text-foreground">{pendingDays}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Available</p>
                <p className="font-medium text-foreground">{remaining}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
