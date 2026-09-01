'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      toast.error('Sign in failed', { description: error.message })
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex-1 flex flex-col md:flex-row">
      {/* Brand panel — hidden on small screens, form fills the page instead */}
      <div className="relative hidden md:flex md:w-1/2 flex-col justify-between overflow-hidden gradient-primary p-10 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-10 h-80 w-80 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur" />
          <span className="text-lg font-semibold">Leave Request System</span>
        </div>

        <div className="relative max-w-sm space-y-3">
          <h2 className="text-2xl font-semibold leading-snug">
            Track and manage your time off, all in one place.
          </h2>
          <p className="text-sm text-white/80">
            Submit requests, follow approvals in real time, and keep an eye on your
            remaining leave balance.
          </p>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} Employee Leave Request System
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="h-9 w-9 rounded-full gradient-primary" />
            <span className="text-lg font-semibold text-foreground">Leave Request System</span>
          </div>

          <h1 className="mb-1 text-xl font-semibold text-foreground">Welcome back</h1>
          <p className="mb-6 text-sm text-muted-foreground">Sign in to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
