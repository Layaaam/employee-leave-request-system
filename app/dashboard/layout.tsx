import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { signOut } from './actions'
import EmployeeSidebar from './_components/EmployeeSidebar'
import EmployeeSidebarData from './_components/EmployeeSidebarData'
import DashboardHeader from './_components/DashboardHeader'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 w-full flex flex-col md:flex-row bg-white/90 shadow-sm border border-border/60 overflow-hidden">
      <Suspense fallback={<EmployeeSidebar signOutAction={signOut} />}>
        <EmployeeSidebarData />
      </Suspense>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gradient-to-br from-white via-violet-50/30 to-pink-50/40">
        <Suspense
          fallback={
            <div className="mb-6 animate-pulse space-y-2">
              <div className="h-6 w-48 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          }
        >
          <DashboardHeader />
        </Suspense>
        {children}
      </div>
    </div>
  )
}
