export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-9 w-40 bg-muted rounded" />
      </div>
      <div className="rounded-md border border-border overflow-hidden">
        <div className="h-10 bg-muted" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 border-t border-border bg-card" />
        ))}
      </div>
    </div>
  )
}
