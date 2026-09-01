import { IconLayoutDashboard, IconLogout } from '@tabler/icons-react'

type Stats = { pending: number; approved: number; rejected: number }

const rows: { key: keyof Stats; label: string; dotClassName: string }[] = [
  { key: 'pending', label: 'Pending', dotClassName: 'bg-amber-400' },
  { key: 'approved', label: 'Approved', dotClassName: 'bg-emerald-400' },
  { key: 'rejected', label: 'Rejected', dotClassName: 'bg-rose-400' },
]

export default function EmployeeSidebar({
  stats,
  signOutAction,
}: {
  stats?: Stats
  signOutAction: () => Promise<void>
}) {
  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col p-6 gap-8 md:h-full md:border-r md:border-border/50">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-full gradient-primary" />
        <span className="font-semibold text-foreground text-lg">Employee</span>
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm bg-accent text-accent-foreground font-medium">
          <IconLayoutDashboard size={18} />
          My Requests
        </div>

        <div className="mt-6 px-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Overview
          </p>
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className={`size-1.5 rounded-full ${r.dotClassName}`} />
                  {r.label}
                </span>
                {stats ? (
                  <span className="font-medium text-foreground tabular-nums">{stats[r.key]}</span>
                ) : (
                  <span className="inline-block h-3 w-4 animate-pulse rounded bg-muted" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground w-full transition-colors"
        >
          <IconLogout size={18} />
          Sign out
        </button>
      </form>
    </aside>
  )
}
