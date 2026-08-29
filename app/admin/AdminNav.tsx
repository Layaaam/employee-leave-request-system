'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
            className={`py-2 border-b-2 ${
              active
                ? 'border-slate-900 text-slate-900 font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
