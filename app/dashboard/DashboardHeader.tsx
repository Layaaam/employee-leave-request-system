import { getDashboardIdentity } from './data'

export default async function DashboardHeader() {
  const { user, profile } = await getDashboardIdentity()

  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-foreground">My Leave Requests</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as {profile?.full_name ?? user.email}
      </p>
    </div>
  )
}
