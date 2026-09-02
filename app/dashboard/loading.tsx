export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="h-6 w-40 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="h-9 w-96 bg-muted rounded" />
        <div className="h-9 w-32 bg-muted rounded" />
      </div>
      <div className="rounded-md border border-border overflow-hidden">
        <div className="h-10 bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 border-t border-border bg-card" />
        ))}
      </div>
    </div>
  )
}
