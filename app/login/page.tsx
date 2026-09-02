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
      <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <span className="text-sm font-medium tracking-wide uppercase text-primary-foreground/70">
          Leave Request System
        </span>

        <div className="max-w-sm space-y-3">
          <h2 className="text-3xl font-semibold leading-snug">
            Track and manage your time off, all in one place.
          </h2>
          <p className="text-sm text-primary-foreground/80">
            Submit requests, follow approvals in real time, and keep an eye on your
            remaining leave balance.
          </p>
        </div>

        <p className="text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Employee Leave Request System
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <span className="mb-8 block text-sm font-medium tracking-wide uppercase text-muted-foreground md:hidden">
            Leave Request System
          </span>

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
