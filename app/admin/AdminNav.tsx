'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Leave Requests' },
  { href: '/admin/leave-types', label: 'Leave Types' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="max-w-6xl mx-auto px-6 flex gap-4 text-sm">
      {links.map((l) => {
        const active = pathname === l.href
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'py-2 border-b-2 transition-colors',
              active
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
