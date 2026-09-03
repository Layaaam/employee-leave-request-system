'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { IconEye, IconEyeOff } from '@tabler/icons-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoading(false)
      setError(error.message)
      toast.error('Sign in failed', { description: error.message })
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', signInData.user.id)
      .single()

    router.replace(profile?.role === 'admin' ? '/admin' : '/dashboard')
    router.refresh()
  }

  return (
    <main className="flex-1 flex flex-col md:flex-row">
      <div className="brand-panel hidden md:flex md:w-1/2 flex-col justify-between p-12 text-[var(--ink-foreground)]">
        <div className="relative flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-[var(--gold)]" aria-hidden="true" />
          <span className="text-sm font-medium text-[var(--ink-foreground)]">
            Leave Request System
          </span>
        </div>

        <div className="relative max-w-sm space-y-4">
          <h2 className="font-display text-[2.35rem] leading-[1.15] font-medium text-[var(--ink-foreground)]">
            Track and manage your time off, all in one place.
          </h2>
          <p className="text-[15px] leading-relaxed text-[var(--ink-muted)]">
            Submit requests, follow approvals in real time, and keep an eye on your
            remaining leave balance.
          </p>
        </div>

        <p className="relative text-xs text-[var(--ink-muted)]">
          © {new Date().getFullYear()} Employee Leave Request System
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-9 flex items-center gap-2.5 md:hidden">
            <span className="h-2 w-2 rounded-full bg-[var(--gold)]" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">
              Leave Request System
            </span>
          </div>

          <h1 className="font-display text-3xl font-medium text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
            Sign in to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-border bg-card px-3.5 transition-colors duration-150 focus-visible:border-[var(--gold)] focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-border bg-card px-3.5 pr-11 transition-colors duration-150 focus-visible:border-[var(--gold)] focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
                >
                  {showPassword ? (
                    <IconEyeOff size={18} stroke={1.75} aria-hidden="true" />
                  ) : (
                    <IconEye size={18} stroke={1.75} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-primary font-medium tracking-tight text-primary-foreground shadow-[0_1px_2px_rgba(20,22,31,0.4)] transition-all duration-150 hover:bg-[var(--ink-soft)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}