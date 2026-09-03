export default function DashboardContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-lg" />
        ))}
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
