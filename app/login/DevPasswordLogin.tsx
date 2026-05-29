'use client'

/*
 * DEV-ONLY — DELETE BEFORE LAUNCH
 *
 * This file exists only to speed up multi-user local testing.
 * It is rendered in app/login/page.tsx behind:
 *   {process.env.NODE_ENV === 'development' && <DevPasswordLogin />}
 *
 * To remove completely:
 *   1. Delete this file.
 *   2. Remove the import and the conditional line from app/login/page.tsx.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DevPasswordLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Full document navigation so the session cookie is present on the next
      // server request. router.push alone does not re-send cookies to the server,
      // which would leave proxy.ts and server components unauthenticated.
      window.location.assign('/studio/dashboard')
    }
  }

  return (
    <div className="mt-8 pt-8 border-t border-stone-200 dark:border-stone-800">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4">
        DEV LOGIN — remove before launch
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="dev-email"
            className="block text-sm font-medium mb-1.5"
          >
            Email
          </label>
          <input
            id="dev-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-700 transition bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600"
          />
        </div>

        <div>
          <label
            htmlFor="dev-password"
            className="block text-sm font-medium mb-1.5"
          >
            Password
          </label>
          <input
            id="dev-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-700 transition bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600"
          />
        </div>

        {error && (
          <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 dark:bg-amber-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-amber-400 dark:hover:bg-amber-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Dev sign in'}
        </button>
      </form>
    </div>
  )
}
