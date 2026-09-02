export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-24 rounded-lg border border-border bg-muted/60" />
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="h-16 bg-muted" />
        <div className="grid grid-cols-7 gap-px bg-border">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 bg-card" />
          ))}
        </div>
      </div>
    </div>
  )
}
