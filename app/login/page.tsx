'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import DevPasswordLogin from './DevPasswordLogin'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-lg font-semibold tracking-tight mb-8">
          Roomlens
        </Link>

        {status === 'sent' ? (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Check your email</h2>
            <p className="text-stone-500 text-sm">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="text-sm text-stone-400 hover:text-stone-600 underline underline-offset-2 mt-4"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold mb-1 text-center">Sign in</h1>
            <p className="text-stone-500 text-sm text-center mb-8">
              We'll send a magic link to your email — no password needed.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-stone-300 transition bg-white text-stone-900 placeholder:text-stone-400"
                />
              </div>

              {status === 'error' && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-stone-900 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          </>
        )}
        {process.env.NODE_ENV === 'development' && <DevPasswordLogin />}
      </div>
    </main>
  )
}
