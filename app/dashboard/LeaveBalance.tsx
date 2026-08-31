type LeaveType = { id: string; name: string; default_days_allowed: number | null }
type Usage = Record<string, number>

export default function LeaveBalance({
  leaveTypes,
  usage,
}: {
  leaveTypes: LeaveType[]
  usage: Usage
}) {
  // Only leave types with a defined cap make sense to show a balance for —
  // Unpaid Leave (default_days_allowed = null) has no "balance" concept.
  const withLimits = leaveTypes.filter((lt) => lt.default_days_allowed !== null)
  if (withLimits.length === 0) return null

  return (
    <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {withLimits.map((lt) => {
        const used = usage[lt.id] ?? 0
        const total = lt.default_days_allowed ?? 0
        const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
        return (
          <div key={lt.id} className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground truncate">{lt.name}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {used} of {total} days used
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full gradient-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
