'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { IconClipboardList, IconTag, IconLogout, IconCalendarStats } from '@tabler/icons-react'

const links = [
  { href: '/admin', label: 'Leave Requests', icon: IconClipboardList },
  { href: '/admin/overview', label: 'Leave Overview', icon: IconCalendarStats },
  { href: '/admin/leave-types', label: 'Leave Types', icon: IconTag },
]

export default function AdminSidebar({
  signOutAction,
}: {
  signOutAction: () => Promise<void>
}) {
  const pathname = usePathname()

  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col p-6 gap-8 md:h-full md:border-r md:border-border/50">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-full gradient-primary" />
        <span className="font-semibold text-foreground text-lg">Admin</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {links.map((l) => {
          const Icon = l.icon
          const active = pathname === l.href
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              )}
            >
              <Icon size={18} />
              {l.label}
            </Link>
          )
        })}
      </nav>

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