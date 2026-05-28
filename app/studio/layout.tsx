import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const configured =
    url.startsWith('https://') && !url.includes('[') && key.length > 20

  if (!configured) return { email: 'dev@placeholder.local' }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white">
        <Link
          href="/studio/dashboard"
          className="text-lg font-semibold tracking-tight"
        >
          Roomlens
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-400">{user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
