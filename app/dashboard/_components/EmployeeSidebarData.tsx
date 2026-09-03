import { getDashboardIdentity } from '../data'
import { signOut } from '../actions'
import EmployeeSidebar from './EmployeeSidebar'

export default async function EmployeeSidebarData() {
  const { pendingCount, approvedCount, rejectedCount } = await getDashboardIdentity()

  return (
    <EmployeeSidebar
      stats={{ pending: pendingCount, approved: approvedCount, rejected: rejectedCount }}
      signOutAction={signOut}
    />
  )
}
