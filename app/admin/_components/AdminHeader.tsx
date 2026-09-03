import { getAdminIdentity } from '../data'

export default async function AdminHeader() {
  const { user, profile } = await getAdminIdentity()

  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-foreground">Admin Console</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as {profile?.full_name ?? user.email}
      </p>
    </div>
  )
}
