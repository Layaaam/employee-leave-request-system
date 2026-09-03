import { getDashboardIdentity } from '../data'

export default async function DashboardHeader() {
  const { user, profile } = await getDashboardIdentity()

  return (
    <p className="mb-6 text-sm text-muted-foreground">
      Signed in as {profile?.full_name ?? user.email}
    </p>
  )
}
