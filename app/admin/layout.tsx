import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { signOut } from '@/app/dashboard/actions'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import AdminContentSkeleton from './AdminContentSkeleton'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 w-full flex flex-col md:flex-row bg-white/90 shadow-sm border border-border/60 overflow-hidden">
      <AdminSidebar signOutAction={signOut} />

      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gradient-to-br from-white via-violet-50/30 to-pink-50/40">
        <Suspense
          fallback={
            <div className="mb-6 animate-pulse space-y-2">
              <div className="h-6 w-40 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          }
        >
          <AdminHeader />
        </Suspense>

        <Suspense fallback={<AdminContentSkeleton />}>{children}</Suspense>
      </div>
    </div>
  )
}
