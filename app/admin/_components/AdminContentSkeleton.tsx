export default function AdminContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="h-9 w-96 bg-muted rounded" />
      </div>
      <div className="rounded-md border border-border overflow-hidden">
        <div className="h-10 bg-muted" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 border-t border-border bg-card" />
        ))}
      </div>
    </div>
  )
}
