export default function StatCards({
  pending,
  approved,
  rejected,
}: {
  pending: number
  approved: number
  rejected: number
}) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="gradient-primary text-white rounded-lg p-4">
        <p className="text-2xl font-semibold">{pending}</p>
        <p className="text-sm opacity-90">Pending</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-2xl font-semibold text-foreground">{approved}</p>
        <p className="text-sm text-muted-foreground">Approved</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-2xl font-semibold text-foreground">{rejected}</p>
        <p className="text-sm text-muted-foreground">Rejected</p>
      </div>
    </div>
  )
}
